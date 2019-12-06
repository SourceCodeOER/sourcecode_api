const models = require('../../models');
const Promise = require("bluebird");
const Sequelize = require("sequelize");

const partition = require('lodash.partition');

module.exports = function (req, res, next) {
    Promise.all(
        req.body.map(tag_category => {
            return models
                .Tag_Category
                .findOrCreate({
                    where: findOrCreateCategory(tag_category)
                })
        })
    ).then(results => {
        // As explained in docs, it return something like [instance, isCreated]
        // https://sequelize.org/master/class/lib/model.js~Model.html#static-method-findOrCreate
        // I just need the instance
        res.json(results.map(result => ({
            id: result[0].id,
            category: result[0].kind
        })));
    }).catch(/* istanbul ignore next */
        err => next(err));
};

// credits to https://webbjocke.com/javascript-check-data-types/#javascript-string
const isString = (value) => typeof value === 'string' /* istanbul ignore next */ || value instanceof String;

// Generate where conditions
// TODO handle case with sub category LATER
function findOrCreateCategory(tag_category) {
    // default case
    /* istanbul ignore next */
    if (isString(tag_category)) {
        return {
            kind: tag_category
        }
    } else {
        // Complex case
        return {
            kind: tag_category.text,
            parent_category: tag_category.category
        }
    }
}