const models = require('../../models');
const Promise = require("bluebird");
const partition = require('lodash.partition');

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// where condition builder
const conditionBuilder = (array_data) => ({
    [Op.or]: array_data.map(tag => ({
        [Op.and]: [
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

// Promise to retrieve
function find_tag_matches(new_tags) {
    return new Promise((resolve, _reject) => {
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
    })
}

module.exports = function (req, res, next) {

    // distinguish already present tags from new tags
    const [already_present_tags, new_tags] = partition(req.body.tags, obj => Number.isInteger(obj));

    // find tag matches for new_tags if already existing
    find_tag_matches(new_tags)
        .then(result => {
            // do the matching process here
            console.log(result);
            next(new Error("NOT YET IMPLEMENTED"));
        }).catch(err => {
            next(err);
        });


    //next(new Error("NOT YET IMPLEMENTED"));
};