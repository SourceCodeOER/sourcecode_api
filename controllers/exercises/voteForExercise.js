const models = require('../../models');
const Promise = require("bluebird");
const Sequelize = require("sequelize");

module.exports = function (req, res, next) {

    // Here we need the serializable isolation level as :
    // - Multiple user can vote on the same exercise on the same time
    // - Precomputed fields in Exercise_metrics need to be accurate ( no phantom row )
    // - A user could try to modify exercise tags whereas other users votes
    // ( two transactions running in the same time ... )
    return models
        .sequelize
        .transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, (t) => {
            return models
                .Notation
                .findOrCreate({
                    where: {
                        exercise_id: req.body.exercise_id,
                        user_id: req.user.id
                    },
                    defaults: {
                        note: req.body.score
                    },
                    transaction: t
                })
                .then(([note, created]) => {
                    return (created)
                        ? Promise.resolve() // nothing else to do as findOrCreate already did the job
                        : note.update({note: req.body.score}, {transaction: t})
                })
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
};