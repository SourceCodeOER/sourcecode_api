const me = require("./users/me");
const updateUser = require("./users/updateUser");
const ListUsers = require("./users/ListUsers");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.me = me;
    controller.updateUser = updateUser;
    controller.ListUsers = ListUsers;

    return controller;
};