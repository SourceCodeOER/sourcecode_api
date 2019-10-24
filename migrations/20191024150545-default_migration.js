'use strict';
const fs = require('fs').promises;
const path = require("path");

module.exports = {
    up: (queryInterface, Sequelize) => {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        const file_path = path.join(__dirname, "sql_dump" ,"initial_database.sql");

        return fs.readFile(file_path, "utf8").then(sql => queryInterface.sequelize.query(sql))
    },

    down: (queryInterface, Sequelize) => {
        // delete all tables since it is the first migrations
        return queryInterface.dropAllTables(queryInterface.sequelize.config.database);
    }
};
