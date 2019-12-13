const express = require('express');
const router = express.Router();
const models = require('../../models');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// to prevent duplicates in database
const {find_tag_matches} = require("../utlis_fct");

// guarded routes
const passport = require('passport');
// guarded router middleware
const only_authentified_user = passport.authenticate("jwt", {
    failWithError: true,
    session: false
});
const check_user_role = require("../../middlewares/check_user_role");

// for fetching
router.get("/", (req, res, next) => {
    const params = req.query.settings || {};
    const settings = {
        tags_ids: params.tags_ids || [],
        categories_ids: params.categories_ids || [],
        state: params.state || "default"
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
        where: Object.assign({}, ...conditions)
    };

    return models
        .Tag
        .findAll(options)
        .then(result => res.json(result))
        .catch(/* istanbul ignore next */
            err => next(err));
});

// For update
router.put("/",
    only_authentified_user,
    check_user_role(["admin"]),
    (req, res, next) => {
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
router.post("/",
    only_authentified_user,
    (req, res, next) => {
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