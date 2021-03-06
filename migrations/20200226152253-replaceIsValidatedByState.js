'use strict';

let opts = {tableName: 'Tags'};
const {TAGS: TagState} = require("../controllers/_common/constants");
const values = Object.values(TagState);

module.exports = {
    up: (queryInterface, Sequelize) => {
        // if using a schema
        if (queryInterface.sequelize.options.schema) {
            opts.schema = queryInterface.sequelize.options.schema;
        }
        return queryInterface.sequelize.transaction(async (t) => {

            // creates the enum
            await queryInterface
                .addColumn(opts, "state", {
                    type: Sequelize.ENUM(values),
                    defaultValue: TagState.NOT_VALIDATED
                }, {transaction: t});

            // populate the db
            await queryInterface
                .bulkUpdate(opts, {
                    state: TagState.VALIDATED
                }, {
                    isValidated: true
                }, {transaction: t});

            // destroy old field
            await queryInterface.removeColumn(opts, "isValidated", {transaction: t});

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
