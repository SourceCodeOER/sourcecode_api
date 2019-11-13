const models  = require('../../models');
const Promise = require("bluebird");
const partition = require('lodash.partition');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (req, res, next) {

    // distinguish already present tags from new tags
    const [already_present_tags, new_tags] = partition(req.body.tags, obj => Number.isInteger(obj));
    // where condition builder
    const whereBuilder = (array_data) => models.sequelize.where(
        models.sequelize.fn("LOWER", models.sequelize.col("text")),
        Op.in,
        array_data
    );

    new Promise((resolve, reject) => {
        // no need to query DB if no new
        if ( new_tags.length === 0 ) {
            resolve([]);
        } else {
            // query database to find possible match before creating new tags
            return models.Tag.findAll({
                attributes: ["id", "text", "category_id"],
                where: whereBuilder(new_tags.map(tag => tag.text))
            })
        }
    }).then(result => {
        console.log(result);
    });


    next(new Error("NOT YET IMPLEMENTED"));
};