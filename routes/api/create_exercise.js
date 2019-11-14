const models = require('../../models');
const Promise = require("bluebird");
const partition = require('lodash.partition');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (req, res, next) {

    // distinguish already present tags from new tags
    const [already_present_tags, new_tags] = partition(req.body.tags, obj => Number.isInteger(obj));
    // where condition builder
    const conditionBuilder = (array_data) => ({
        [Op.or]:  array_data.map(tag => ({
            [Op.and] : [
                models.sequelize.where(
                    models.sequelize.col("category_id"),
                    Op.eq,
                    tag.category_id
                ),
                models.sequelize.where(
                    models.sequelize.fn("LOWER", models.sequelize.col("text")),
                    Op.eq,
                    models.sequelize.fn("LOWER", tag.text)
                )
            ]
        }))
    });

    new Promise((resolve, reject) => {
        // no need to query DB if no new
        if (new_tags.length === 0) {
            resolve([]);
        } else {
            // query database to find possible match before creating new tags
            return models.Tag.findAll({
                attributes: ["id", "text", "category_id"],
                where: conditionBuilder(new_tags)
            })
        }
    }).then(result => {
        console.log(result);
    });


    next(new Error("NOT YET IMPLEMENTED"));
};