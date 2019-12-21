const models = require('../../../models');

module.exports = (req, res, next) => {
    return models
        .Tag_Category
        .findAll({
            attributes: [
                "id",
                ["kind", "category"]
            ]
        })
        .then((result) => res.json(result))
        .catch(/* istanbul ignore next */
            err => next(err))
};