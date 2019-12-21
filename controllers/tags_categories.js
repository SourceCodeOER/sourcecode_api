const getTagCategories = require("./tags_categories/getTagCategories");
const updateTagCategory = require("./tags_categories/updateTagCategory");
const getTagCategoriesWithTags = require("./tags_categories/getTagCategoriesWithTags");

module.exports = function () {
    // useful for Dependency Injection
    // https://byu-oit.github.io/openapi-enforcer-middleware/guide/controllers#dependency-injection
    const controller = {};

    // add endpoints
    controller.getTagCategories = getTagCategories;
    controller.updateTagCategory = updateTagCategory;
    controller.getTagCategoriesWithTags = getTagCategoriesWithTags;

    return controller;
};