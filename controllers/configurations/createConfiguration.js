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
                .create({
                    user_id: req.user.id,
                    name: req.body.name,
                    title: req.body.title /* istanbul ignore next */ || ""
                }, {
                    transaction: t
                })
                .then(configuration => {
                    return models
                        .Configuration_Tag
                        .bulkCreate(
                            req.body.tags.map(tag => ({
                                tag_id: tag,
                                configuration_id: configuration.id
                            })), {
                                transaction: t
                            });
                });
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
};