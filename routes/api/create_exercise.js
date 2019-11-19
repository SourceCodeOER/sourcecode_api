const models = require('../../models');
const Promise = require("bluebird");

const partition = require('lodash.partition');

const Sequelize = require("sequelize");

// delegate tag matching process to specialized functions
const {
    find_tag_matches,
    matching_process
} = require("../utlis_fct");

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
            })
            .then((_) => {
                // OK work as expected
                resolve()
            })
            .catch(err => {
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
        )
        .then(() => {
            res.status(200).end()
        })
        .catch(err => {
            next(err);
        });

};