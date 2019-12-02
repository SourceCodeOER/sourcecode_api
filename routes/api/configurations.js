const express = require('express');
const router = express.Router();
const models = require('../../models');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

router.get("/", (req, res, next) => {
    return models
        .Configuration
        .findAll({
            attributes: {
                exclude: ["user_id"]
            },
            include: [{
                model: models.Configuration_Tag,
                as: "tags",
                required: true,
            }],
            where: {
                user_id: req.user.id
            }
        })
        .then(configurations => res.json(configurations))
        .catch(/* istanbul ignore next */
            err => next(err));
});

router.post("/", (req, res, next) => {
    // transaction here as if anything bad happens, we don't commit that to database
    return models
        .sequelize
        .transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
        }, (t) => {
            return models
                .Configuration
                .create({
                    user_id: req.user.id,
                    name: req.body.name,
                    title: req.body.title /* istanbul ignore next */ || ""
                }, {
                    transaction: t
                })
                .then(configuration => {
                    return models
                        .Configuration_Tag
                        .bulkCreate(
                            req.body.tags.map(tag => ({
                                tag_id: tag,
                                configuration_id: configuration.id
                            })), {
                                transaction: t
                            });
                });
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
});

router.put("/", (req, res, next) => {
    // transaction here as if anything bad happens, we don't commit that to database
    return models
        .sequelize
        .transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
        }, (t) => {
            return models
                .Configuration
                .findAll({
                    where: {
                        user_id: req.user.id,
                        id: req.body.id
                    },
                    transaction: t,
                    rejectOnEmpty: true
                })
                .then(([configuration]) => {
                    return Promise.all([
                        // update this row with new values
                        configuration.update({
                            name: req.body.name,
                            title: req.body.title /* istanbul ignore next */ || ""
                        }, {
                            transaction: t
                        }),
                        // delete old rows
                        // here we don't care about performance ^^
                        models
                            .Configuration_Tag
                            .destroy({
                                where: {
                                    configuration_id: configuration.id
                                },
                                transaction: t
                            })
                    ])
                        .then(() => {
                            return models
                                .Configuration_Tag
                                .bulkCreate(
                                    req.body.tags.map(tag => ({
                                        tag_id: tag,
                                        configuration_id: configuration.id
                                    })), {
                                        transaction: t
                                    });
                        });
                });
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
});

module.exports = router;