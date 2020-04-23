const login = require("./auth/login");
const register = require("./auth/register");
const verify = require("./auth/verify");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.register = register;
    controller.signIn = login;
    controller.verify = verify;

    return controller;
};