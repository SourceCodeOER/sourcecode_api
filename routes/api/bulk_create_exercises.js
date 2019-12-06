const {
    bulky_store_exercises
} = require("../utlis_fct");

module.exports = function (req, res, next) {
    // TODO link file with exercise before calling bulkInsert
    const exercises_with_maybe_a_file = req.body.map(exercise => {
        // TODO implement correct version later
        return  Object.assign({}, exercise, {file: null});
    });
    bulky_store_exercises(req.user, exercises_with_maybe_a_file)
        .then((_) => res.status(200).end())
        .catch(/* istanbul ignore next */
            (err) => next(err));
};