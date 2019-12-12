const models = require('../../models');
const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');

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
}), (req, res, next) => {
    // TODO
});

module.exports = router;