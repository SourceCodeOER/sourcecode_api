const CreateConfiguration = require("./configurations/createConfiguration");
const FetchOwnConfigurations = require("./configurations/fetchOwnConfigurations");
const UpdateConfiguration = require("./configurations/updateConfiguration");
const DeleteConfiguration = require("./configurations/deleteConfiguration");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.CreateConfiguration = CreateConfiguration;
    controller.FetchOwnConfigurations = FetchOwnConfigurations;
    controller.UpdateConfiguration = UpdateConfiguration;
    controller.DeleteConfiguration = DeleteConfiguration;

    return controller;
};