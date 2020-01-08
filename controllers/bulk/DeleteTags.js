const models = require('../../models');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (req, res, next) {

    // transaction here as if anything bad happens, we don't commit that to database
    return models
        .sequelize
        .transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, (t) => {
            return models
                .Exercise_Tag
                .destroy({
                    transaction: t,
                    where: {
                        tag_id: {
                            [Op.in]: req.body
                        }
                    }
                })
                .then(() => {
                    // Finally remove the tags with force ( so drop cascade )
                    return models
                        .Tag
                        .destroy({
                            force: true, // even if it is in paranoid mode ;)
                            transaction: t,
                            where: {
                                id: {
                                    [Op.in]: req.body
                                }
                            }
                        })
                });
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            (err) => next(err));
};