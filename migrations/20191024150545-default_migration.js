'use strict';
const fs = require('fs').promises;
const path = require("path");

module.exports = {
    up: (queryInterface, Sequelize) => {
        const file_path = path.join(__dirname, "..", "sql" ,"initial_database.sql");
        //return Promise.resolve();
        return fs.readFile(file_path, "utf8").then(sql => queryInterface.sequelize.query(sql))
    },

    down: (queryInterface, Sequelize) => {
        // delete all tables since it is the first migrations
        return queryInterface.dropAllSchemas();
    }
};
