const models = require('../../models');
const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');
const check_user_role = require("../../middlewares/check_user_role");

router.get("/", (req, res, next) => {
    return models
        .Tag_Category
        .findAll({
            attributes: [
                "id",
                ["kind", "category"]
            ]
        })
        .then((result) => res.json(result))
        .catch(/* istanbul ignore next */
            err => next(err))
});

router.put("/", passport.authenticate("jwt", {
        failWithError: true,
        session: false
    }),
    check_user_role(["admin"]),
    (req, res, next) => {
        return models
            .Tag_Category
            .findAll({
                where: {
                    id: req.body.id
                },
                limit: 1,
                rejectOnEmpty: true
            })
            .then(([instance]) => {
                return instance.update({
                    kind: req.body.category
                });
            })
            .then((_) => res.status(200).end())
            .catch(/* istanbul ignore next */
                err => next(err))
    });

module.exports = router;