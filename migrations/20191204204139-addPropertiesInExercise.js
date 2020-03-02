'use strict';

let opts = {tableName: 'Exercises'};

module.exports = {
    up: (queryInterface, Sequelize) => {
        if (queryInterface.sequelize.options.schema) {
            opts.schema = queryInterface.sequelize.options.schema;
        }
        return queryInterface.sequelize.transaction(async (t) => {

            await queryInterface.addColumn(opts, "file", {
                type: Sequelize.STRING,
                allowNull: true
            }, {transaction: t});

            await queryInterface.addColumn(opts, "isValidated", {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }, {transaction: t});

            await queryInterface.addColumn(opts, "url", {
                type: Sequelize.STRING,
                allowNull: true
            }, {transaction: t});

            return Promise.resolve();
        });
    },

    down: (queryInterface, Sequelize) => {
        if (queryInterface.sequelize.options.schema) {
            opts.schema = queryInterface.sequelize.options.schema;
        }
        return queryInterface.sequelize.transaction(async (t) => {

            await queryInterface.removeColumn(opts, "file", {transaction: t});
            await queryInterface.removeColumn(opts, "isValidated", {transaction: t});
            await queryInterface.removeColumn(opts, "url", {transaction: t});

            return Promise.resolve();
        });
    }
};
