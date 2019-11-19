const models = require('../models');
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const partition = require('lodash.partition');
const groupBy = require('lodash.groupby');

// Some utilities functions commonly used
module.exports = {
    // return "data" result for /search and /exercise/{id}
    build_search_result(ids) {
        // models.sequelize.getDialect() == "postgres"
        return new Promise((resolve, reject) => {
            // For Postgres, we have a much better way to handle this case
            if (models.sequelize.getDialect() === "postgres") {
                // decompose this complex task to several sub queries
                // Why ?
                // 1. Database can more easily cache rows
                // 2. Inner join with more of 3 tables with millions of rows is a memory leak
                // 3. More easily to maintain that
                Promise
                    .all([
                        // exercises with their metrics
                        models
                            .Exercise
                            .scope([
                                "default_attributes_for_bulk",
                                {method: ["filter_exercises_ids", ids]},
                                "with_exercise_metrics"
                            ])
                            // no order by needed as rows in database will be returned sequentially for that part
                            .findAll(),
                        // get the tag(s) (with the category ) for exercise(s)
                        models
                            .Exercise_Tag
                            .scope([
                                {method: ["filter_by_exercise_ids", ids]},
                                "get_all_tags_with_related_category"
                            ])
                            .findAll()
                    ])
                    .then(([exercises_data, tags_data]) => {
                        // key : exercise_id
                        const tags_data_map = groupBy(tags_data, "exercise_id");
                        resolve(
                            exercises_data.map((exercise) => {
                                    // manually build the good result
                                    const exercise_id = exercise.get("id");
                                    let tags_for_exercise = tags_data_map[exercise_id][0].toJSON();
                                    delete tags_for_exercise["exercise_id"];
                                    return Object.assign({}, exercise.toJSON(), tags_for_exercise)
                                }
                            )
                        )
                    }).catch(err => reject(err));

            } else {
                // fallback implementation : It should never be used as it is highly inefficient
                // ORMs aren't bullet silver in every case
                models
                    .Exercise
                    .scope([
                        "default_attributes_for_bulk",
                        {
                            method: ["filter_exercises_ids", ids]
                        },
                        "with_exercise_metrics",
                        "exercise_with_metrics_and_tags_and_categories_related"
                    ])
                    .findAll()
                    .then(data => resolve(data))
                    .catch(err => reject(err))
            }
        })
    },

    // Promise that try to match new_tags with the result in DB
    matching_process(already_present_tags, new_tags, result_in_db) {
        return new Promise(resolve => {
            // set up structure for matching
            let tag_dictionary = groupBy(result_in_db, "text");
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
    },

    // Promise to retrieve possible matches for new tag
    find_tag_matches(new_tags) {
        return new Promise((resolve, reject) => {
            // no need to query DB if no new
            if (new_tags.length === 0) {
                resolve([]);
            } else {
                // query database to find possible match before creating new tags
                models
                    .Tag
                    .findAll({
                        attributes: [
                            "id",
                            [Sequelize.fn("LOWER", Sequelize.col("text")), "text"],
                            "category_id"
                        ],
                        where: conditionBuilder(new_tags)
                    })
                    .then(result => resolve(result))
                    .catch(err => reject(err))
            }
        })
    }
};

// private functions here
// where condition builder for tag matching process
const conditionBuilder = (array_data) => ({
    [Op.or]: array_data.map(tag => ({
        [Op.and]: [
            Sequelize.where(
                Sequelize.col("category_id"),
                Op.eq,
                tag.category_id
            ),
            Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("text")),
                Op.eq,
                tag.text.toLowerCase()
            )
        ]
    }))
});