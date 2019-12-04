const express = require('express');
const router = express.Router();

const models = require('../../models');
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const partition = require('lodash.partition');
const difference = require('lodash.difference');


// function for bulky inner select
const {
    build_search_result,
    find_tag_matches,
    build_dictionary_for_matching_process,
    matching_process
} = require("../utlis_fct");

router.get("/:exerciseId", (req, res, next) => {

    const id = parseInt(req.params.exerciseId, 10);

    // check if id exist in database
    return models
        .Exercise
        .findByPk(id, {
            attributes: [
                Sequelize.literal(1)
            ],
            rejectOnEmpty: true
        }).then((result) => {
            return build_search_result([id]);
        }).then(data => {
            // data is an array : I just need the first item
            res.json(data[0]);
        }).catch(err => {
            next(err);
        })

});

// TODO later secure that to prevent some mad genius to do stuff they can't
router.put("/:exerciseId", (req, res, next) => {

    const id = parseInt(req.params.exerciseId, 10);
    // distinguish already present tags from new tags
    const [already_present_tags, new_tags] = partition(req.body.tags, obj => Number.isInteger(obj));

    return find_exercise_tags_and_search_possible_new_tags_match(
        [id, req.body.version, new_tags, already_present_tags]
    )
        .then(result => compute_tag_changes(result))
        .then(([changes, tags_to_be_inserted]) => {

            // transaction here as if anything bad happens, we don't commit that to database
            return models
                .sequelize
                .transaction({
                    isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
                }, (t) => {
                    // if new tags to insert, do that
                    // if not, do nothing
                    return insert_new_tags_if_there_is_at_least_one(tags_to_be_inserted, t)
                        .then((created_tags) => handle_all_cases_for_tags([id, changes, created_tags, t]))
                        .then(() => update_exercise([id, req.body, t]))
                })
        })
        .then(() => {
            // everything works as expected : tell that to user
            res.status(200).end();
        })
        .catch(/* istanbul ignore next */
            err => {
                if (err instanceof Sequelize.EmptyResultError) {
                    let error = new Error("Resource not found / Outdated version");
                    error.message = "It seems you are using an outdated version of this resource : Operation denied";
                    error.status = 409;
                    next(error);
                } else {
                    // default handler
                    next(err);
                }
            })

});

module.exports = router;

// some methods that made life easier with this hell of promise chaining
function find_exercise_tags_and_search_possible_new_tags_match(
    [
        id,
        version,
        new_tags,
        already_present_tags
    ]
) {
    return Promise.all([
        // Find current exercise version with its tags
        models
            .Exercise
            .findAll({
                attributes: ["id"],
                where: {
                    [Op.and]: [
                        {id: id},
                        {version: version}
                    ]
                },
                include: [
                    {
                        model: models.Exercise_Tag,
                        as: "tag_entries",
                        require: true,
                        attributes: [
                            "tag_id"
                        ]
                    }
                ],
                rejectOnEmpty: true
            }),
        // Find possible match for new tag(s)
        find_tag_matches(new_tags)
            .then(result => {
                const tag_dictionary = build_dictionary_for_matching_process(result);
                return matching_process(already_present_tags, new_tags, tag_dictionary);
            })
    ])
}

function compute_tag_changes([[exercise_with_tag_records], [new_tags, tags_to_be_inserted]]) {
    const old_tags = exercise_with_tag_records
        .get("tag_entries")
        .map(tag => tag.get("tag_id"));
    // computes the changes in order to insert (or not) minimal number of new rows
    // as we could add and remove tags, we must handle both cases at once
    let changes = {
        "added": difference(new_tags, old_tags),
        "deleted": difference(old_tags, new_tags)
    };
    // delegate work to other promise
    return Promise.resolve([changes, tags_to_be_inserted]);
}

function insert_new_tags_if_there_is_at_least_one(tags_to_be_inserted, t) {
    const creationDate = new Date();
    if (tags_to_be_inserted.length === 0) {
        return Promise.resolve([])
    } else {
        return models
            .Tag
            .bulkCreate(tags_to_be_inserted.map(tag => ({
                // no matter of the kind of user, creating tags like that should be reviewed
                isValidated: false,
                text: tag.text,
                category_id: tag.category_id,
                // some timestamps must be inserted
                updatedAt: creationDate,
                createdAt: creationDate
            })), {
                transaction: t,
                // I must retrieve the inserted row(s) ids for later
                returning: ["id"]
            })
    }
}

function handle_all_cases_for_tags([id, changes, created_tags, t]) {

    // add the newly created tag(s) into "added" key
    // if empty, it does nothing ^^
    changes["added"] = changes["added"].concat(
        created_tags.map(tag => tag.id)
    );

    // if there is only additions in tags, we will use our hook to deal with the update part of precomputed data
    // if not, we have to do that manually
    const onlyAdditions = (changes["added"].length > 0 && changes["deleted"].length === 0);

    // multiple cases can occur here
    switch (true) {
        // 1. no changes in the tags : the PERFECT case
        case (changes["added"].length === 0 && changes["deleted"].length === 0):
            return Promise.resolve();

        // 2. Only additions in tags : The AVERAGE case
        // ( we can rely on the hook in Exercise_Tag to update precomputed data eg : "tags_ids" )
        case onlyAdditions:
            return models
                .Exercise_Tag
                .bulkCreate(changes["added"].map(tag => ({
                    tag_id: tag,
                    exercise_id: id
                })), {
                    transaction: t
                });

        // 3. additions and deletes : The HARD case
        // We have to manually do what the hook in Exercise_Tag does
        // as there is no "instances" with their API for bulkDestroy
        default:
            return Promise.all([
                // insert the new tags
                models
                    .Exercise_Tag
                    .bulkCreate(changes["added"].map(tag => ({
                        tag_id: tag,
                        exercise_id: id
                    })), {
                        transaction: t,
                        hooks: false // we have to disable the hook on them for no recompute things two times
                    }),
                // delete the old tags
                models
                    .Exercise_Tag
                    .destroy({
                        where: {
                            [Op.and]: [
                                {exercise_id: id},
                                {
                                    tag_id: {
                                        [Op.in]: changes["deleted"]
                                    }
                                }
                            ]
                        },
                        transaction: t
                    })
            ]).then(() => {
                // retrieve the new "tags_ids" array & update the Exercise_metrics row
                return models
                    .Exercise_Tag
                    .scope([
                        {method: ["filter_by_exercise_ids", [id]]},
                        {method: ["tags_summary", {transaction: t}]}
                    ])
                    .findAll({
                        transaction: t,
                        rejectOnEmpty: true
                    })
            }).then(([data]) => {
                // as Exercise_Metrics doesn't use version lock and/or timestamps, more easily to update
                return models
                    .Exercise_Metrics
                    .update({
                        "tags_ids": data.get("tags")
                    }, {
                        where: {
                            exercise_id: data.get("exercise_id")
                        },
                        transaction: t
                    })
            })
    }
}

function update_exercise([id, body, t]) {
    // TODO handle new attributes : file , url
    return models
        .Exercise
        .scope([
            {method: ["filter_exercises_ids", [id]]}
        ])
        .findAll({
            transaction: t,
            rejectOnEmpty: true,
            where: {
                version: body.version
            }
        })
        .then(([instance]) => {
            return instance.update({
                title: body.title,
                description: body.description
            }, {
                transaction: t
            })
        })
}