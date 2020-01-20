const getExerciseByID = require("./exercises/getExerciseByID");
const UpdateExercise = require("./exercises/updateExercise");
const createSingleExercise = require("./exercises/createSingleExercise");
const searchExercises = require("./exercises/searchExercises");
const voteForExercise = require("./exercises/voteForExercise");
const ExportExercises = require("./exercises/exportExercises");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.getExerciseByID = getExerciseByID;
    controller.UpdateExercise = UpdateExercise;
    controller.createSingleExercise = createSingleExercise;
    controller.searchExercises = searchExercises;
    controller.voteForExercise = voteForExercise;
    controller.ExportExercises = ExportExercises;

    return controller;
};
