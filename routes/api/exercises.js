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

    return Promise.all([
        // Find current exercise version with its tags
        models
            .Exercise
            .findAll({
                where: {
                    [Op.and]: [
                        {id: id},
                        {version: req.body.version}
                    ]
                },
                include: [
                    {
                        model: models.Exercise_Tag,
                        as: "tag_entries",
                        attributes: [
                            "tag_id"
                        ]
                    }
                ],
                rejectOnEmpty: true
            }),
        // Find possible match for new tag(s)
        find_tag_matches(new_tags)
            .then(result => matching_process(already_present_tags, new_tags, result))
    ])
        .then(([[exercise_with_tag_records], [new_tags, tags_to_be_inserted]]) => {
            const old_tags = exercise_with_tag_records
                .get("tag_entries")
                .map(tag => tag.get("tag_id"));
            // computes the changes in order to insert (or not) minimal number of new rows
            // as we change add and remove tags, we must handle both cases at once
            const changes = {
                "added": difference(new_tags, old_tags),
                "deleted": difference(old_tags, new_tags)
            };
            // delegate work to other promise
            return Promise.resolve([changes, tags_to_be_inserted]);
        })
        .then( ([]) => {

        })
        .then( () => {
            // everything works as expected : tell that to user
            res.status(200).end();
        })
        .catch(err => {
            console.log(err);
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