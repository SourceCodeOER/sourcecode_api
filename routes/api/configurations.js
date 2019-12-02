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

});

router.put("/", (req, res, next) => {

});

module.exports = router;