const models = require('../../models');
const Promise = require("bluebird");

const partition = require('lodash.partition');
const groupBy = require('lodash.groupby');

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
                tag.text.toLowerCase()
            )
        ]
    }))
});

// Promise to retrieve possible matches for new tag
function find_tag_matches(new_tags) {
    return new Promise((resolve, reject) => {
        // no need to query DB if no new
        if (new_tags.length === 0) {
            resolve([]);
        } else {
            // query database to find possible match before creating new tags
            models
                .Tag
                .findAll({
                    attributes: ["id", "text", "category_id"],
                    where: conditionBuilder(new_tags)
                })
                .then(result => resolve(result))
                .catch(err => reject(err))
        }
    })
}

// Promise that try to match new_tags with the result in DB
function matching_process(already_present_tags, new_tags, result_in_db) {
    return new Promise(resolve => {
        // set up structure for matching
        console.log(already_present_tags);
        let tags_lowercase_text = result_in_db.map(tag => {
            tag.text = tag.text.toLowerCase();
            return tag;
        });
        let tag_dictionary = groupBy(tags_lowercase_text, "text");
        Object.keys(tag_dictionary).forEach(item => {
            tag_dictionary[item] = groupBy(tag_dictionary[item], "category_id");
        });
        // do the matching process here
        const [has_match, no_match] = partition(new_tags,
            tag =>
                tag.text.toLowerCase() in tag_dictionary
                && tag.category_id in tag_dictionary[tag.text.toLowerCase()]
        );
        // takes the first match
        resolve([
            already_present_tags.concat(
                has_match.map(tag => {
                    return tag_dictionary[tag.text.toLowerCase()][tag.category_id][0].id
                })
            ),
            no_match
        ]);
    });
}

module.exports = function (req, res, next) {

    // distinguish already present tags from new tags
    const [already_present_tags, new_tags] = partition(req.body.tags, obj => Number.isInteger(obj));

    // find tag matches for new_tags if already existing
    find_tag_matches(new_tags)
        .then(result => {
            // try to match them
            return matching_process(already_present_tags, new_tags, result);
        })
        .then(
            ([existent_tags, really_new_tags]) => {
                console.log("YOLO");
            }
        )
        .catch(err => {
            next(err);
    });


    //next(new Error("NOT YET IMPLEMENTED"));
};