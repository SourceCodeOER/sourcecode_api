'use strict';

let opts = {tableName: 'Exercises'};

module.exports = {
    up: (queryInterface, Sequelize) => {
        if (queryInterface.sequelize.options.schema) {
            opts.schema = queryInterface.sequelize.options.schema;
        }
        return Promise.all([
            queryInterface.removeColumn(opts, "isValidated"),
            queryInterface.addColumn(opts, "state", {
                type: Sequelize.ENUM("DRAFT", "PENDING", "VALIDATED", "NOT_VALIDATED"),
                defaultValue: "DRAFT"
            })
        ]);
    },

    down: (queryInterface, Sequelize) => {
        if (queryInterface.sequelize.options.schema) {
            opts.schema = queryInterface.sequelize.options.schema;
        }
        return Promise.all([
            queryInterface.removeColumn(opts, "state")
        ]);
    }
};
