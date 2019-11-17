const models = require('../../models');
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Default limit in this endpoint
const METADATA = {
    page: 1,
    size: 10
};

// return ids of exercises that match
function find_exercises_ids_with_given_criteria(parameters, metadata) {

    return models
        .Exercise
        .scope({
            method: ["find_exercises_ids_with_given_criteria", [parameters, metadata]]
        }).findAndCountAll();
}

// build the full result
function buildResult(params) {
    const {
        result: {count: totalItems, rows: exercise_ids},
        metadata: {page, size},
    } = params;
    return new Promise((resolve, reject) => {
        const ids = exercise_ids.map(exercise => exercise.id);
        // if ids is a empty array, it is simple : empty array
        if (ids.length === 0) {
            resolve({
                metadata: {
                    currentPage: page,
                    pageSize: size,
                    totalItems: totalItems,
                    totalPages: Math.ceil(totalItems / size)
                },
                data: []
            })
        } else {
            // more complex, at least one result
            models
                .Exercise
                .scope({
                    method: ["exercise_with_metrics_and_tags_and_categories_related", ids]
                })
                .findAll()
                .then(data => {
                    resolve({
                        metadata: {
                            currentPage: page,
                            pageSize: size,
                            totalItems: totalItems,
                            totalPages: Math.ceil(totalItems / size)
                        },
                        data: data
                    })
                }).catch(err => reject(err));
        }

    });
}

module.exports = function (req, res, next) {

    // merge page criteria
    const updated_metadata = {...METADATA, ...(req.body.hasOwnProperty("metadata") ? req.body.metadata : {})};
    find_exercises_ids_with_given_criteria(req.body, updated_metadata)
        .then(result => {
            return buildResult({
                result: result,
                metadata: updated_metadata
            });
        })
        .then(result => res.json(result))
        .catch(err => {
            console.log(err);
            next(err);
        });
};