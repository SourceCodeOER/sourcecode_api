const models = require('../../models');
const Sequelize = require("sequelize");

module.exports = (req, res, next) => {
    // transaction here as if anything bad happens, we don't commit that to database
    return models
        .sequelize
        .transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
        }, (t) => {
            return models
                .Configuration
                .destroy({
                    force: true, // even if it is in paranoid mode ;)
                    transaction: t,
                    where: {
                        "user_id" : req.user.id,
                        "id": req.body.id
                    }
                })
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
};