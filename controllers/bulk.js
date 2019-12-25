const createOrFindTagCategories = require("./bulk/createOrFindTagCategories");
const createMultipleExercises = require("./bulk/createMultipleExercises");
const DeleteExercises = require("./bulk/DeleteExercises");
const ValidateExercises = require("./bulk/ValidateExercises");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.createOrFindTagCategories = createOrFindTagCategories;
    controller.createMultipleExercises = createMultipleExercises;
    controller.DeleteExercises = DeleteExercises;
    controller.ValidateExercises = ValidateExercises;

    return controller;
};