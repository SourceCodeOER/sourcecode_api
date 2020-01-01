const login = require("./auth/login");
const register = require("./auth/register");
const me = require("./auth/me");
const updateUser = require("./auth/updateUser");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.me = me;
    controller.register = register;
    controller.signIn = login;
    controller.updateUser = updateUser;

    return controller;
};