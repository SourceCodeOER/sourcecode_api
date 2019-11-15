const models = require('../../models');
const Promise = require("bluebird");

const partition = require('lodash.partition');
const groupBy = require('lodash.groupby');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// where condition builder
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
function matching_process(already_present_tags, new_tags, result_in_db) {
    return new Promise(resolve => {
        // set up structure for matching
        let tag_dictionary = groupBy(result_in_db, "text");
        Object.keys(tag_dictionary).forEach(item => {
            tag_dictionary[item] = groupBy(tag_dictionary[item], "category_id");
        });
        // do the matching process here
        const [has_match, no_match] = partition(new_tags,
            tag =>
                tag.text.toLowerCase() in tag_dictionary
                && tag.category_id in tag_dictionary[tag.text.toLowerCase()]
        );
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

// Promise to store exercise
// it should be a transaction as if something fails, nothing should remain
function store_exercise(user, exercise_data, existent_tags, really_new_tags) {
    return new Promise((resolve, reject) => {
        models
            .sequelize
            .transaction({
                isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
            }, (t) => {
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
            }).then((_) => {
                // OK work as expected
                resolve()
            }).catch(err => {
                reject(err)
            })
    });
}

module.exports = function (req, res, next) {

    // distinguish already present tags from new tags
    const [already_present_tags, new_tags] = partition(req.body.tags, obj => Number.isInteger(obj));

    // find tag matches for new_tags if already existing
    find_tag_matches(new_tags)
        .then(result => {
            // try to match them
            return matching_process(already_present_tags, new_tags, result);
        })
        .then(
            ([existent_tags, really_new_tags]) => {
                return store_exercise(req.user, req.body, existent_tags, really_new_tags);
            }
        ).then(() => {
            res.status(200).end()
        }).catch(err => {
            next(err);
        });

};