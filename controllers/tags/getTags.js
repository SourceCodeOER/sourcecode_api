const models = require('../../models');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = (req, res, next) => {
    const params = req.query;
    const arrayOfIntegersOnly = (key) => (Array.isArray(params[key]))
        ? params[key].filter(s => !isNaN(s)).map(s => parseInt(s))
        : [];
    const onlyString = (key, defaultValue) => (typeof params[key] === "string")
        ? params[key]
        : defaultValue;

    const settings = {
        tags_ids: arrayOfIntegersOnly("tags_ids"),
        categories_ids: arrayOfIntegersOnly("categories_ids"),
        state: onlyString("state", "default"),
        title: onlyString("title", ''),
    };

    let conditions = [];

    // must we include conditions or not
    if (settings.state !== "default") {
        conditions.push({
            isValidated: settings.state === "validated"
        })
    }
    if (settings.tags_ids.length > 0) {
        conditions.push({
            id: {
                [Op.in]: settings.tags_ids
            }
        })
    }
    if (settings.categories_ids.length > 0) {
        conditions.push({
            category_id: {
                [Op.in]: settings.categories_ids
            }
        })
    }
    if (settings.title.length > 0) {
        conditions.push({
            text: {
                [Op.iLike]: `%${settings.title}%`
            }
        });
    }

    // create the findOptions
    const options = {
        // dynamic create the where clause
        where: Object.assign({}, ...conditions)
    };

    return models
        .Tag
        .scope('common_attributes')
        .findAll(options)
        .then(result => res.send(result.map(tag => tag.toJSON())))
        .catch(/* istanbul ignore next */
            err => next(err));
};
