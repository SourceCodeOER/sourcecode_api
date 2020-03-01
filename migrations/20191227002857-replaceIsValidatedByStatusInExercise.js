'use strict';

let opts = {tableName: 'Exercises'};

module.exports = {
    up: (queryInterface, Sequelize) => {
        if (queryInterface.sequelize.options.schema) {
            opts.schema = queryInterface.sequelize.options.schema;
        }

        return queryInterface.sequelize.transaction(async (t) => {

            await queryInterface.removeColumn(opts, "isValidated", {transaction: t});
            await queryInterface.addColumn(opts, "state", {
                type: Sequelize.ENUM("DRAFT", "PENDING", "VALIDATED", "NOT_VALIDATED"),
                defaultValue: "DRAFT"
            }, {transaction: t});

            return Promise.resolve();
        });
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
