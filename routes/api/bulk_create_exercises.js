const {
    bulky_store_exercises
} = require("../utlis_fct");

module.exports = function (req, res, next) {
    // TODO Find a way to link exercise too
    bulky_store_exercises(req.user, req.body)
        .then((_) => res.status(200).end())
        .catch(/* istanbul ignore next */
            (err) => next(err));
};