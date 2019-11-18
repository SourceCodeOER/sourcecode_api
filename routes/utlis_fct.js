const models = require('../models');
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const groupBy = require('lodash.groupby');

module.exports = {
    // return "data" result for /search and /
    build_search_result(ids) {
        // models.sequelize.getDialect() == "postgres"
        return new Promise((resolve, reject) => {
            // For Postgres, we have a much better way to handle this case
            if (models.sequelize.getDialect() === "postgres") {
                // decompose this complex task to
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
    }
};

//