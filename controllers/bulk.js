const createOrFindTagCategories = require("./bulk/createOrFindTagCategories");
const createMultipleExercises = require("./bulk/createMultipleExercises");
const DeleteExercises = require("./bulk/DeleteExercises");
const ChangeExercisesStatus = require("./bulk/ChangeExercisesStatus");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.createOrFindTagCategories = createOrFindTagCategories;
    controller.createMultipleExercises = createMultipleExercises;
    controller.DeleteExercises = DeleteExercises;
    controller.ChangeExercisesStatus = ChangeExercisesStatus;

    return controller;
};