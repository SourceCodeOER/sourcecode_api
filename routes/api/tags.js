const express = require('express');
const router = express.Router();
const models = require('../../models');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// to prevent duplicates in database
const {
    find_tag_matches,
    build_dictionary_for_matching_process,
    matching_process
} = require("../utlis_fct");

// for fetching
router.get("/", (req, res, next) => {
    // TODO Fix of OpenApi validator to full test this endpoint
    const settings = {
        tags_ids: req.query.tags_ids || [],
        categories_ids: req.query.categories_ids || [],
        state: req.query.state || "default"
    };

    let conditions = [];

    // must we include conditions or not
    if (settings.state !== "default") {
        conditions.push({
            isValidated: settings.state === "validated"
        })
    }
    if (settings.tags_ids.length > 0) {
        conditions.push({
            id: {
                [Op.in]: settings.tags_ids
            }
        })
    }
    if (settings.categories_ids.length > 0) {
        conditions.push({
            category_id: {
                [Op.in]: settings.categories_ids
            }
        })
    }

    // create the findOptions
    const options = {
        attributes: [
            ["id", "tag_id"],
            ["text", "tag_text"],
            "category_id",
            "isValidated",
            "version"
        ],
        // dynamic create the where clause
        where: (conditions.length === 0)
            ? {}
            : (conditions.length === 1)
                ? conditions[0]
                : {
                    [Op.and]: conditions
                }
    };

    return models
        .Tag
        .findAll(options)
        .then(result => res.json(result))
        .catch(/* istanbul ignore next */
            err => next(err));
});

// For update
// TODO later secure that to prevent some mad genius to do stuff they can't
router.put("/", (req, res, next) => {
    const {
        tag_id,
        tag_text,
        category_id,
        isValidated,
        version
    } = req.body;

    // cannot use here findByPk as it ignores my where clause
    return models
        .Tag
        .findAll({
            where: {
                [Op.and]: [
                    {
                        id: tag_id
                    },
                    {
                        version: version
                    }
                ]
            },
            rejectOnEmpty: true
        })
        .then(([instance]) => {
            return instance.update({
                category_id: category_id,
                text: tag_text,
                isValidated: isValidated
            });
        })
        .then(() => {
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
            });
});

// create a Tag Proposal
router.post("/", (req, res, next) => {
    const creationDate = new Date();
    const {
        text,
        category_id
    } = req.body;

    // find tag matches for new_tags if already existing
    return find_tag_matches([{category_id, text}])
        .then(result => {
            // if no match, this is truly a new tag to be add ( otherwise do nothing )
            return (result.length > 0)
                ? Promise.resolve()
                : models
                    .Tag
                    .create({
                        text: text,
                        category_id: category_id,
                        // by default, consider a tag as not official
                        isValidated: false,
                        // some date
                        updateAt: creationDate,
                        createAt: creationDate
                    })
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
});

module.exports = router;