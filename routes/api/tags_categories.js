const models = require('../../models');

module.exports = function (req, res, next) {
    return models
        .Tag_Category
        .findAll({
            attributes: [
                "id",
                ["kind", "category"]
            ]
        })
        .then( (result) => res.json(result) )
        .catch(err => next(err))
};