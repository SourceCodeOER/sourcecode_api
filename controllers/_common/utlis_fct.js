const models = require('../../models');
const fileManager = require("./files_manager");
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const partition = require('lodash.partition');
const groupBy = require('lodash.groupby');
const uniqWith = require('lodash.uniqwith');
const isEqual = require('lodash.isequal');

// state
const {TAGS: tagState, EXERCISES: exerciseState, USERS: userRoles} = require("./constants");

// Some utilities functions commonly used
module.exports = {
    // return "data" result for /search and /exercise/{id}
    // This function takes 3 parameters (only the first one is mandatory)
    // - ids : the ordered list of exercises ids we have to generate
    // - the include options : to generate what the user asks
    // - request : the full body of request
    build_search_result(ids,
                        {
                            includeCreator = false,
                            includeMetrics = true,
                            includeDescription = true,
                            includeTags = true,
                        } = {},
                        request
    ) {

        return new Promise((resolve, reject) => {
            // For Postgres, we have a much better way to handle this case
            // decompose this complex task to several sub queries
            // Why ?
            // 1. Database can more easily cache rows
            // 2. Inner join with more of 3 tables with millions of rows is a memory leak
            // 3. More easily to maintain that

            // Default scope for Exercise
            let exerciseScope = [
                "default_attributes_for_bulk",
                {method: ["filter_exercises_ids", ids]},
            ];

            // If asked, add the metrics exercises
            if (includeMetrics) {
                exerciseScope.push("with_exercise_metrics");
            }

            // If asked, add the creator of exercise
            if (includeCreator) {
                exerciseScope.push("with_exercise_creator");
            }

            // If asked, don't include description
            if (!includeDescription) {
                exerciseScope.push("without_exercise_description");
            }

            // If asked, include the tags
            if (includeTags) {
                exerciseScope.push(
                    {method: ["with_related_tags_with_their_category", request.filterOptions]}
                );
            }

            return models
                .Exercise
                .scope(exerciseScope)
                .findAll()
                .then((exercises_data) => {
                    // key : exercise_id
                    const exercises_data_map = groupBy(exercises_data, "id");
                    resolve(
                        ids
                            // handle the case if the exercise doesn't exist anymore because someone deleted it
                            .filter(id => exercises_data_map.hasOwnProperty(id))
                            // manually build the good result
                            .map(id => {
                                let exercise = exercises_data_map[id][0];
                                let exercise_json = exercise.toJSON();

                                // only apply this logic when we have a metric object inside exercise
                                if (includeMetrics) {
                                    // metrics.avg_score should be a number with only 2 decimal
                                    exercise_json["metrics"]["avg_score"] = Number(
                                        parseFloat(exercise_json["metrics"]["avg_score"]).toFixed(2)
                                    );
                                }

                                return Object.assign({}, exercise_json)
                            })
                    );
                }).catch(/* istanbul ignore next */
                    err => reject(err));

        })
    },

    // Promise that try to match new_tags with the result in DB
    matching_process: matching_process,

    // Promise to retrieve possible matches for new tag
    find_tag_matches: find_tag_matches,
    // to create the dictionary used for matching_process
    "build_dictionary_for_matching_process": build_dictionary_for_matching_process,

    "check_credentials_on_exercises": check_credentials_on_exercises,

    // To check that we have at least N validated tags
    validated_tag_count(ids, required_number) {
        return new Promise((resolve, reject) => {
            // As https://github.com/sequelize/sequelize/issues/5732 is not implemented
            // I will use a workaround ( like my scope "count_summary" )
            const filterGen = (where) => Sequelize.literal(`COUNT(*) FILTER ${where}`);
            models
                .Tag
                .findAll({
                    attributes: [
                        [
                            filterGen(`(WHERE "Tag"."state" = '${tagState.VALIDATED}')`),
                            "total"
                        ]
                    ],
                    where: {
                        id: {
                            [Op.in]: ids
                        }
                    }
                }).then(([result]) => {
                let count = parseInt(result.get("total"));
                if (count >= required_number) {
                    resolve();
                } else {
                    let error = new Error("Bad Request");
                    error.message = `Required ${required_number} validated tag(s) - only ${count} is/are validated`;
                    error.status = 400;
                    reject(error);
                }
            }).catch(/* istanbul ignore next */
                err => reject(err))
        });
    },

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
                .catch(/* istanbul ignore next */
                    err => reject(err))
        });
    },

    // Promise to store bulky exercise(s)
    bulky_store_exercises(user, exercises) {
        const creationDate = new Date();
        const no_file = [null, undefined];
        return new Promise((resolve, reject) => {
            return models
                .sequelize
                .transaction({
                    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
                }, (t) => {
                    // separate tags proposal from existent tags in exercises
                    let exercises_with_tags_partition = exercises.map(exercise => {
                        // apart the tags field, nothing changes in the exercise object
                        return Object.assign({}, exercise, {
                            // here partition is necessary to separate existent tags from no existent yet
                            tags: partition(exercise.tags, obj => Number.isInteger(obj))
                        });
                    });

                    // collect all the tags to be inserted ( thanks to partition )
                    // to prevent dummy insert, only takes unique elements
                    const all_tags_in_exercises = [].concat(
                        ...exercises_with_tags_partition.map(exercise => exercise.tags[1])
                    );
                    const tags_to_be_inserted = find_unique_tags(all_tags_in_exercises);

                    // find possible match for not existent tags
                    return find_tag_matches(tags_to_be_inserted)
                        .then(result => {
                            const tag_dictionary = build_dictionary_for_matching_process(result);
                            const reduced_dictionary = dictionary_for_similarity(tag_dictionary);
                            return matching_process2(tags_to_be_inserted, tag_dictionary, reduced_dictionary);
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
                                                    state: tagState.NOT_VALIDATED,
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
                            let tags_dictionary = build_dictionary_for_matching_process(existent_tags.concat(...inserted_tags));
                            const exercises_with_tags = reconcile_exercises_with_tags(exercises_with_tags_partition, tags_dictionary);
                            // Finally bulk insert all of these
                            return Promise.all(exercises_with_tags.map(
                                // I don't use the really new tags here since in bulk insert,
                                // we may have the same new tag to insert : This is handled above
                                ([exercise, tags]) => {
                                    return store_single_exercise(
                                        user,
                                        exercise,
                                        tags,
                                        [],
                                        t
                                    );
                                })
                            );
                        });
                }).then((_) => {
                    // OK work as expected
                    resolve()
                }).catch(/* istanbul ignore next */
                    err => {
                        const files_to_be_deleted = exercises
                            .filter((exercise) => !no_file.includes(exercise.file))
                            .map(exercise => exercise.file);

                        fileManager
                            .delete_temp_files(files_to_be_deleted)
                            .then(() => reject(err));
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
    // create exercise and new tags together
    const creationDate = new Date();
    // data to be inserted
    let exerciseData = {
        title: exercise_data.title,
        description: exercise_data.description /* istanbul ignore next */ || "",
        user_id: user.id,
        // some timestamps must be inserted
        updatedAt: creationDate,
        createdAt: creationDate,
        // optional properties to add
        url: exercise_data.url || null,
        file: (exercise_data.file !== null) ? exercise_data.file.filename : null,
        state: (exercise_data.state) ? exerciseState[exercise_data.state] : exerciseState.DRAFT
    };

    return new Promise((resolve, reject) => {
        Promise.all(
            [
                // if a file was provided, we must be able to store it
                (exercise_data.file !== null)
                    ? fileManager.move_file_to_destination_folder(exercise_data.file)
                    : Promise.resolve(),
                // create the exercise with given information
                models
                    .Exercise
                    .create(
                        exerciseData,
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
                                state: tagState.NOT_VALIDATED,
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
            ])
            .then(([_, exercise, tags]) => {
                // add the newly created tags ids to array so that I can bulk insert easily
                // TODO
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
            .then((result) => resolve(result))
            .catch(/* istanbul ignore next */(err) => {

                // delete uploaded file in storage folder
                // let the middleware destroy the file in temp folder
                const storedFile = (exercise_data.file !== null) ? [exercise_data.file.filename] : [];
                fileManager
                    .delete_stored_files(storedFile)
                    .then(() => reject(err));
            })
    });
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
                .catch(/* istanbul ignore next */
                    err => reject(err))
        }
    })
}

// Promise that try to match new_tags with the result in DB
// As I only
function matching_process(already_present_tags, new_tags, tag_dictionary) {
    return new Promise(resolve => {
        // I must rely on my function to correctly find a good match for tag
        const reduced_dictionary = dictionary_for_similarity(tag_dictionary);
        const [has_match, no_match] = super_matching_process(new_tags, tag_dictionary, reduced_dictionary);
        resolve([
            // Using a Set to prevent duplicate entries ( very rare case that could occur in some scenarios )
            [...new Set(
                already_present_tags.concat(
                    ...has_match.map(tag => tag.id)
                )
            )],
            no_match
        ]);
    });
}

// ONLY FOR BULK INSERT, we need a mutated version of the matching_process
// As we need all the information for later, I cannot use only ID like the original version
function matching_process2(new_tags, tag_dictionary, reduced_dictionary) {
    return new Promise(resolve => {
        // do the matching process here
        const [has_match, no_match] = super_matching_process(new_tags, tag_dictionary, reduced_dictionary);
        resolve(
            [
                has_match,
                no_match
            ]
        );
    });
}

// Dictionary to handle similar tag contents
function dictionary_for_similarity(tag_dictionary) {
    return Object
        .entries(tag_dictionary)
        .map(([key, values]) => ({
                "original_key": key,
                "lower_key": key.toLowerCase(),
                "categories": Object.keys(values)
            })
        );
}

// To find similar tags and match them
// to handle multiple case, we need the real keys of the dictionary and the categories linked to that name
// reduced_dictionary should be dictionary_for_similarity(tag_dictionary)
// PS: I pass that by argument because of multiple exercise ( recreates n times the same time is a performance issue )
function super_matching_process(new_tags, tag_dictionary, reduced_dictionary) {
    // try to find matches
    const new_tags_with_maybe_the_existent_tag = new_tags.map(
        tag => {
            const maybeAKeyMatch = reduced_dictionary.find(t => {
                return isEqual(tag.text.toLowerCase(), t.lower_key) && t.categories.includes(tag.category_id.toString())
            });

            // Handle both cases : if we found a match or not
            return [
                maybeAKeyMatch !== undefined,
                (maybeAKeyMatch !== undefined)
                    ? tag_dictionary[maybeAKeyMatch.original_key][tag.category_id][0]
                    : tag
            ];
        }
    );
    // Does something similar to partition method of Lodash but here I have no choice ^^
    return new_tags_with_maybe_the_existent_tag.reduce((acc, curr) => {
        const index = (curr[0] === true) ? 0 : 1;
        acc[index] = acc[index].concat(curr[1]);
        return acc;
    }, [[], []]);
}

// for bulky insert, we need a function close to matching_process but adapted to this situation
// since it is required to have a match for each tags, we could simplify that
function reconcile_exercises_with_tags(exercises_with_tags_partition, tag_dictionary) {
    // useful for later
    const reduced_dictionary = dictionary_for_similarity(tag_dictionary);

    return exercises_with_tags_partition.map(exercise => {
        // concat the existent tags with newly created
        const uniqTags = find_unique_tags(exercise.tags[1]);
        const [has_match, _no_match] = super_matching_process(uniqTags, tag_dictionary, reduced_dictionary);

        const found_matches = has_match.map(tag => tag.id);

        const tags = exercise.tags[0].concat(
            // We must handle the case where a similar text already exist in database (but not the same typo )
            // Thanks to super_matching_process and previous pre/post conditions, every tag will have a match
            // and an id
            ...found_matches
        );
        return [exercise, tags];
    });
}

// To find unique tags given in an array
function find_unique_tags(tags_array) {
    return uniqWith(
        tags_array,
        (tag1, tag2) => {
            // the perfect case (but life isn't perfect ^^)
            /* istanbul ignore if */
            if (isEqual(tag1, tag2)) {
                return true;
            } else {
                // similar tag : same category but different case ("c" and "C")

                return tag1.category_id === tag2.category_id
                    && isEqual(tag1.text.toLowerCase(), tag2.text.toLowerCase());
            }
        }
    );
}

// For UPDATE / DELETE operations on exercises, we must verify that user is allowed to do that
function check_credentials_on_exercises({role, id}, exercises_ids) {
    return new Promise((resolve, reject) => {
        if ([userRoles.ADMIN, userRoles.SUPER_ADMIN].includes(role)) {
            resolve();
        } else {
            models
                .Exercise
                .findAll({
                    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('user_id')), 'user']],
                    where: {
                        id: {
                            [Op.in]: exercises_ids
                        }
                    }
                }, {
                    rejectOnEmpty: true
                })
                .then((exercises_creators) => {
                    const all_from_this_user = exercises_creators
                        .map(creator => creator.get("user"))
                        .every((creator) => creator === id);
                    // I don't want to create a complete test case just for that
                    /* istanbul ignore if */
                    if (all_from_this_user) {
                        resolve();
                    } else {
                        let error = new Error("FORBIDDEN");
                        error.message = "It seems you tried to update / delete somebody else exercise(s) : " +
                            "This incident will be reported";
                        error.status = 403;
                        reject(error);
                    }
                })
                .catch(/* istanbul ignore next */
                    (err) => reject(err));
        }
    })
}
