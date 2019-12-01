const models = require('../../models');
const Promise = require("bluebird");

module.exports = function (req, res, next) {
    return models
        .Notation
        .findOrCreate({
            where: {
                exercise_id: req.body.exercise_id,
                user_id: req.user.id
            },
            defaults: {
                note: req.body.score
            }
        })
        .then(([note, created]) => {
            return (created)
                ? Promise.resolve() // nothing else to do as findOrCreate already did the job
                : note.update({note: req.body.score})
        })
        .then( () => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
};