const models = require('../../models');
const Promise = require("bluebird");

module.exports = (req, res, next) => {

    // parameters for exports
    const parameters = req.body;

    // scopes for export
    let exercise_scopes = [
        // handle the filtering
        {method: ["find_exercises_ids_with_given_criteria", {"parameters": parameters}]},
        // include the tags
        {method: ["with_related_tags", parameters.filterOptions]},
        // default attributes for bulk select
        "default_attributes_for_bulk",
    ];

    // handle sorting
    /* istanbul ignore else */
    if (Array.isArray(parameters.orderBy)) {
        exercise_scopes.push({
            method: ["orderByClauses", parameters.orderBy]
        })
    }

    return Promise.all([
        // tag categories as an object
        models
            .Tag_Category
            .scope("allTagsCategoriesAsObject")
            .findAll(),
        // exercises with relevant scope
        models
            .Exercise
            .scope(exercise_scopes)
            .findAll(),
    ]).then(([[tagCategories], exercises]) => {
        const result = Object.assign(
            {},
            tagCategories.toJSON(),
            {"exercises": exercises.map(ex => ex.toJSON())}
        );
        res.send(result);
    }).catch(/* istanbul ignore next */
        err => next(err));
};
