'use strict';

let opts = { tableName: 'Configurations' };

module.exports = {
  up: (queryInterface, Sequelize) => {
    if (queryInterface.sequelize.options.schema) {
      opts.schema = queryInterface.sequelize.options.schema;
    }
    return queryInterface.addColumn(opts, "title", {
      defaultValue: "",
      type: Sequelize.STRING
    });
  },

  down: (queryInterface, Sequelize) => {
    if (queryInterface.sequelize.options.schema) {
      opts.schema = queryInterface.sequelize.options.schema;
    }
    return queryInterface.removeColumn(opts, "title")
  }
};
