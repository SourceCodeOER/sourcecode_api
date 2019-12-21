const getTags = require("./tags/getTags");
const submitTagProposal = require("./tags/submitTagProposal");
const updateTag = require("./tags/updateTag");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.updateTag = updateTag;
    controller.submitTagProposal = submitTagProposal;
    controller.getTags = getTags;

    return controller;
};