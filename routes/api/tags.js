const express = require('express');
const router = express.Router();
const models = require('../../models');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// for fetching
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

// For update
// TODO later secure that to prevent some mad genius to do stuff they can't
router.put("/",(req, res, next) => {

    //const updateDate = new Date();
    const {
        tag_id,
        tag_text,
        category_id,
        isValidated,
        version
    } = req.body;

    return models
        .Tag
        .update({
            category_id: category_id,
            text: tag_text,
            isValidated: isValidated,
            // sequelize doesn't seem to update that one
            version: version + 1
        }, {
            where: {
                [Op.and]: [{ id: tag_id }, { version : version}]
            }
        })
        .then( (check) => {
            const numberOfRowAffected = check[0];
            // TODO find later which the optimisticLock error isn't throw
            if (numberOfRowAffected !== 1) {
                let error = new Error("It seems you are using an outdated version of this resource : Operation denied");
                error.status = 409;
                next(error)
            } else {
                res.status(200).end()
            }
        })
        .catch(err => next(err));
});

// create a Tag Proposal
router.post("/",(req, res, next) => {
    const creationDate = new Date();
    const {
        text,
        category_id
    } = req.body;

    return models
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
        .then( () => res.status(200).end())
        .catch( err => next(err));
});

module.exports = router;