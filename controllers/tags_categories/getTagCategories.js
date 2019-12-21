const models = require('../../models');

module.exports = (req, res, next) => {
    return models
        .Tag_Category
        .findAll({
            attributes: [
                "id",
                ["kind", "category"]
            ]
        })
        .then((result) => res.send(result.map(cat => cat.toJSON())))
        .catch(/* istanbul ignore next */
            err => next(err))
};