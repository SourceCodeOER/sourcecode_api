const {
    bulky_store_exercises
} = require("../utlis_fct");

module.exports = function (req, res, next) {
    bulky_store_exercises(req.user, req.body)
        .then((_) => res.status(200).end())
        .catch(/* istanbul ignore next */
            (err) => next(err));
};