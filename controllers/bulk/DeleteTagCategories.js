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
            // first remove ExerciseTag rows to trigger hook
            return models
                .Tag
                .findAll({
                    attributes: [
                        "id"
                    ],
                    where: {
                        category_id: {
                            [Op.in]: req.body
                        }
                    },
                    transaction: t
                })
                .then((rows) => {
                    // extract tags ids
                    return Promise.resolve(rows.map(r => r.get("id")));
                })
                .then((tags_ids) => {
                    return models
                        .Exercise_Tag
                        .destroy({
                            transaction: t,
                            where: {
                                tag_id: {
                                    [Op.in]: tags_ids
                                }
                            }
                        })
                })
                .then(() => {
                    // Finally remove the category with force ( so drop cascade )
                    return models
                        .Tag_Category
                        .destroy({
                            force: true, // even if it is in paranoid mode ;)
                            transaction: t,
                            where: {
                                id: {
                                    [Op.in]: req.body
                                }
                            }
                        });
                });
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            (err) => next(err));
};