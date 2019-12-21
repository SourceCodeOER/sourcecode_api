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
                .findAll({
                    where: {
                        user_id: req.user.id,
                        id: req.body.id
                    },
                    transaction: t,
                    rejectOnEmpty: true
                })
                .then(([configuration]) => {
                    return Promise.all([
                        // update this row with new values
                        configuration.update({
                            name: req.body.name,
                            title: req.body.title /* istanbul ignore next */ || ""
                        }, {
                            transaction: t
                        }),
                        // delete old rows
                        // here we don't care about performance ^^
                        models
                            .Configuration_Tag
                            .destroy({
                                where: {
                                    configuration_id: configuration.id
                                },
                                transaction: t
                            })
                    ])
                        .then(() => {
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
                });
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
};