const models = require('../models');
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const partition = require('lodash.partition');
const groupBy = require('lodash.groupby');
const uniqWith = require('lodash.uniqwith');
const isEqual = require('lodash.isequal');

// Some utilities functions commonly used
module.exports = {
    // return "data" result for /search and /exercise/{id}
    build_search_result(ids) {
        // models.sequelize.getDialect() == "postgres"
        return new Promise((resolve, reject) => {
            // For Postgres, we have a much better way to handle this case
            if (models.sequelize.getDialect() === "postgres") {
                // decompose this complex task to several sub queries
                // Why ?
                // 1. Database can more easily cache rows
                // 2. Inner join with more of 3 tables with millions of rows is a memory leak
                // 3. More easily to maintain that
                Promise
                    .all([
                        // exercises with their metrics
                        models
                            .Exercise
                            .scope([
                                "default_attributes_for_bulk",
                                {method: ["filter_exercises_ids", ids]},
                                "with_exercise_metrics"
                            ])
                            // no order by needed as rows in database will be returned sequentially for that part
                            .findAll(),
                        // get the tag(s) (with the category ) for exercise(s)
                        models
                            .Exercise_Tag
                            .scope([
                                {method: ["filter_by_exercise_ids", ids]},
                                "get_all_tags_with_related_category"
                            ])
                            .findAll()
                    ])
                    .then(([exercises_data, tags_data]) => {
                        // key : exercise_id
                        const tags_data_map = groupBy(tags_data, "exercise_id");
                        resolve(
                            exercises_data.map((exercise) => {
                                    // manually build the good result
                                    const exercise_id = exercise.get("id");
                                    let tags_for_exercise = tags_data_map[exercise_id][0].toJSON();
                                    delete tags_for_exercise["exercise_id"];
                                    return Object.assign({}, exercise.toJSON(), tags_for_exercise)
                                }
                            )
                        )
                    }).catch(err => reject(err));

            } else {
                // fallback implementation : It should never be used as it is highly inefficient
                // ORMs aren't bullet silver in every case
                models
                    .Exercise
                    .scope([
                        "default_attributes_for_bulk",
                        {
                            method: ["filter_exercises_ids", ids]
                        },
                        "with_exercise_metrics",
                        "exercise_with_metrics_and_tags_and_categories_related"
                    ])
                    .findAll()
                    .then(data => resolve(data))
                    .catch(err => reject(err))
            }
        })
    },

    // Promise that try to match new_tags with the result in DB
    matching_process: matching_process,

    // Promise to retrieve possible matches for new tag
    find_tag_matches: find_tag_matches,
    // to create the dictionary used for matching_process
    "build_dictionary_for_matching_process": build_dictionary_for_matching_process,

    // To store a single exercise
    store_single_exercise(user, exercise_data, existent_tags, really_new_tags) {
        return new Promise((resolve, reject) => {
            models
                .sequelize
                .transaction({
                    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
                }, (t) => {
                    return store_single_exercise(user, exercise_data, existent_tags, really_new_tags, t)
                })
                .then((_) => {
                    // OK work as expected
                    resolve()
                })
                .catch(err => {
                    reject(err)
                })
        });
    },

    // Promise to store bulky exercise(s)
    bulky_store_exercises(user, exercises) {
        const creationDate = new Date();
        return new Promise((resolve, reject) => {
            return models
                .sequelize
                .transaction({
                    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
                }, (t) => {
                    // separate tags proposal from existent tags in exercises
                    let exercises_with_tags_partition = exercises.map(exercise => ({
                        title: exercise.title,
                        description: exercise.description,
                        // here partition is necessary to separate existent tags from no existent yet
                        tags: partition(exercise.tags, obj => Number.isInteger(obj))
                    }));

                    // collect all the tags to be inserted ( thanks to partition )
                    // to prevent dummy insert, only takes unique elements
                    const tags_to_be_inserted = uniqWith(
                        []
                            .concat(...exercises_with_tags_partition
                                .map(exercise => exercise.tags[1]))
                        , isEqual);

                    // find possible match for not existent tags
                    return find_tag_matches(tags_to_be_inserted)
                        .then(result => {
                            const tag_dictionary = build_dictionary_for_matching_process(result);
                            return matching_process2(tags_to_be_inserted, tag_dictionary);
                        }).then(
                            ([existent_tags, really_new_tags]) => {
                                return Promise.all([
                                    Promise.resolve(existent_tags),
                                    // insert new tags and retrieve ids
                                    models
                                        .Tag
                                        .bulkCreate(
                                            really_new_tags.map(tag => {
                                                return {
                                                    // no matter of the kind of user, creating tags like that should be reviewed
                                                    isValidated: false,
                                                    text: tag.text,
                                                    category_id: tag.category_id,
                                                    // some timestamps must be inserted
                                                    updatedAt: creationDate,
                                                    createdAt: creationDate
                                                }
                                            }),
                                            {
                                                transaction: t,
                                                returning: ["id", "text", "category_id"]
                                            }
                                        )
                                ])
                            }
                        ).then(([existent_tags, inserted_tags]) => {
                            // now time to bind inserted tags with their exercise
                            // merge both array for reconciliation
                            let tags_dictionary = build_dictionary_for_matching_process(existent_tags.concat(inserted_tags));
                            const exercises_with_tags = reconcile_exercises_with_tags(exercises_with_tags_partition, tags_dictionary);
                            // Finally bulk insert all of these
                            return Promise.all(exercises_with_tags.map(
                                // I don't use the really new tags here since in bulk insert,
                                // we may have the same new tag to insert : This is handled above
                                ([exercise, tags]) => {
                                    return store_single_exercise(user, exercise, tags, [], t);
                                })
                            );
                        });
                }).then((_) => {
                    // OK work as expected
                    resolve()
                }).catch(err => {
                    reject(err)
                });
        });
    }
};

// private functions here
// where condition builder for tag matching process
const conditionBuilder = (array_data) => ({
    [Op.or]: array_data.map(tag => ({
        [Op.and]: [
            Sequelize.where(
                Sequelize.col("category_id"),
                Op.eq,
                tag.category_id
            ),
            Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("text")),
                Op.eq,
                tag.text.toLowerCase()
            )
        ]
    }))
});

// to create the dictionary used for matching_process
function build_dictionary_for_matching_process(result_in_db) {
    // set up structure for matching
    let tag_dictionary = groupBy(result_in_db, "text");
    Object.keys(tag_dictionary).forEach(item => {
        tag_dictionary[item] = groupBy(tag_dictionary[item], "category_id");
    });
    return tag_dictionary;
}

// to store a single exercise
function store_single_exercise(user, exercise_data, existent_tags, really_new_tags, t) {
    // create exercise and news tag together
    const creationDate = new Date();
    return Promise.all([
        // create the exercise with given information
        models
            .Exercise
            .create(
                {
                    title: exercise_data.title,
                    description: exercise_data.description,
                    user_id: user.id,
                    // some timestamps must be inserted
                    updatedAt: creationDate,
                    createdAt: creationDate
                },
                {
                    transaction: t,
                    returning: ["id"]
                }
            )
        ,
        // bulky create the new tags into the systems
        models
            .Tag
            .bulkCreate(
                really_new_tags.map(tag => {
                    return {
                        // no matter of the kind of user, creating tags like that should be reviewed
                        isValidated: false,
                        text: tag.text,
                        category_id: tag.category_id,
                        // some timestamps must be inserted
                        updatedAt: creationDate,
                        createdAt: creationDate
                    }
                }),
                {
                    transaction: t,
                    returning: ["id"]
                }
            )
    ]).then(([exercise, tags]) => {
        // add the newly created tags ids to array so that I can bulk insert easily
        const all_tags_ids = existent_tags.concat(
            tags.map(tag => tag.id)
        );
        return models
            .Exercise_Tag
            .bulkCreate(
                all_tags_ids.map(tag => ({
                    tag_id: tag,
                    exercise_id: exercise.id
                })),
                {
                    transaction: t
                }
            )
    })
}

// Promise to retrieve possible matches for new tag
function find_tag_matches(new_tags) {
    return new Promise((resolve, reject) => {
        // no need to query DB if no new
        if (new_tags.length === 0) {
            resolve([]);
        } else {
            // query database to find possible match before creating new tags
            models
                .Tag
                .findAll({
                    attributes: [
                        "id",
                        [Sequelize.fn("LOWER", Sequelize.col("text")), "text"],
                        "category_id"
                    ],
                    where: conditionBuilder(new_tags)
                })
                .then(result => resolve(result))
                .catch(err => reject(err))
        }
    })
}

// Promise that try to match new_tags with the result in DB
function matching_process(already_present_tags, new_tags, tag_dictionary) {
    return new Promise(resolve => {
        // do the matching process here
        const [has_match, no_match] = find_match(tag_dictionary, new_tags);
        // takes the first match
        resolve([
            already_present_tags.concat(
                has_match.map(tag => {
                    return tag_dictionary[tag.text.toLowerCase()][tag.category_id][0].id
                })
            ),
            no_match
        ]);
    });
}

// ONLY FOR BULK INSERT, we need a mutated version of the matching_process
// As we need all the information for later, I cannot use only ID like the original version
function matching_process2(new_tags, tag_dictionary) {
    return new Promise(resolve => {
        // do the matching process here
        const [has_match, no_match] = find_match(tag_dictionary, new_tags);
        resolve([
            has_match.map(tag => tag_dictionary[tag.text.toLowerCase()][tag.category_id][0])
            ,
            no_match
        ])
    });
}

// inner function used in matching_process
function find_match(tag_dictionary, new_tags) {
    return partition(new_tags,
        tag =>
            tag.text.toLowerCase() in tag_dictionary
            && tag.category_id in tag_dictionary[tag.text.toLowerCase()]
    );
}

// for bulky insert, we need a function close to matching_process but adapted to this situation
// since it is required to have a match for each tags, we could simplify that
function reconcile_exercises_with_tags(exercises_with_tags_partition, tag_dictionary) {
    // useful for later
    const tags_keys = Object.keys(tag_dictionary).map(key => ({original_key: key, lower_key: key.toLowerCase()}));
    return exercises_with_tags_partition.map(exercise => {
        // concat the existent tags with newly created
        const tags = exercise.tags[0].concat(
            exercise.tags[1].map(tag => {
                // We must handle the case where a similar text already exist in database (but not the same typo )
                // Thanks to tags_keys, we can retrieve the correct text for dictionary
                const lower_key = tag.text.toLowerCase();
                const tag_text = (tag_dictionary.hasOwnProperty(tag.text))
                    ? tag.text
                    : tags_keys
                        .filter(tag_tuple => tag_tuple.lower_key === lower_key)
                        .slice(0, 1)
                        .reduce((_prev, current) => {
                            return current.original_key;
                        }, "");
                return tag_dictionary[tag_text][tag.category_id][0].id;
            })
        );
        return [exercise, tags];
    });
}