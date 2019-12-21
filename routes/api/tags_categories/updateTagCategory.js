const models = require('../../../models');

module.exports = (req, res, next) => {
    return models
        .Tag_Category
        .findAll({
            where: {
                id: req.body.id
            },
            limit: 1,
            rejectOnEmpty: true
        })
        .then(([instance]) => {
            return instance.update({
                kind: req.body.category
            });
        })
        .then((_) => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err))
};