const express = require('express');
const router = express.Router();
const models = require('../../models');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

router.get("/",(req, res, next) => {
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
        .catch(err => next(err));
});

router.put("/",(req, res, next) => {
    // TODO
    next(new Error("NOT YET IMPLEMENTED"));
});

router.post("/",(req, res, next) => {
    // TODO
    next(new Error("NOT YET IMPLEMENTED"));
});

module.exports = router;