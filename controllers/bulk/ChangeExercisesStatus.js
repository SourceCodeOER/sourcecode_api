const models = require('../../models');
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (req, res, next) {

    const state = req.body.state;

    return models
        .sequelize
        .transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
        }, (t) => {
            return models
                .Exercise
                .findAll({
                    where: {
                        id: {
                            [Op.in]: req.body.exercises
                        }
                    }
                }, {
                    transaction: t
                }).then((exercises) => {
                    return Promise.all(
                        exercises.map( (exercise) => exercise.update({
                            state: state
                        }, {
                            transaction: t
                        }))
                    );
                });
        })
        .then((_) => res.status(200).end())
        .catch(/* istanbul ignore next */
            (err) => next(err));
};