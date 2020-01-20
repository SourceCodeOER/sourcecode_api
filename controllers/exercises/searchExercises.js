const models = require('../../models');
const Promise = require("bluebird");

// function for bulky inner select
const build_search_result = require("../_common/utlis_fct").build_search_result;

// Default limit in this endpoint
const METADATA = {
    page: 1,
    size: 10
};

// return ids of exercises that match
function find_exercises_ids_with_given_criteria(parameters, metadata) {

    let exercise_scopes = [];

    // handle the filtering here
    exercise_scopes.push({
        method: ["find_exercises_ids_with_given_criteria", {parameters, metadata}]
    });

    // handle sorting
    if (Array.isArray(parameters.orderBy)) {
        exercise_scopes.push({
            method: ["orderByClauses", parameters.orderBy]
        })
    }

    return models
        .Exercise
        .scope(exercise_scopes)
        .findAndCountAll({
            attributes: ["id"]
        });
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
            build_search_result(ids, params["request"]["includeOptions"], params["request"])
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
                }).catch(/* istanbul ignore next */
                err => reject(err));
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
                metadata: updated_metadata,
                request: req.body,
            });
        })
        .then(result => res.send(result))
        .catch(/* istanbul ignore next */
            err => next(err));
};
