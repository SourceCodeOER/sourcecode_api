'use strict';

let opts = {tableName: 'Exercises'};

module.exports = {
    up: (queryInterface, Sequelize) => {
        if (queryInterface.sequelize.options.schema) {
            opts.schema = queryInterface.sequelize.options.schema;
        }
        return Promise.all([
            queryInterface.addColumn(opts, "file", {
                type: Sequelize.STRING,
                allowNull: true
            }),
            queryInterface.addColumn(opts, "isValidated", {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }),
            queryInterface.addColumn(opts, "url", {
                type: Sequelize.STRING,
                allowNull: true
            })
        ]);
    },

    down: (queryInterface, Sequelize) => {
        if (queryInterface.sequelize.options.schema) {
            opts.schema = queryInterface.sequelize.options.schema;
        }
        return Promise.all([
            queryInterface.removeColumn(opts, "file"),
            queryInterface.removeColumn(opts, "isValidated"),
            queryInterface.removeColumn(opts, "url")
        ]);
    }
};
