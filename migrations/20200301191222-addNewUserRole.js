'use strict';

let enumName = "enum_Users_role";
let enumValue = "super_admin";

module.exports = {
    up: (queryInterface, Sequelize) => {
        // if using a schema
        let schema;
        if (queryInterface.sequelize.options.schema) {
            schema = queryInterface.sequelize.options.schema;
        }
        let enumNameWithSchema = (schema) ? `"${schema}"."${enumName}"` : `"${enumName}"`;
        return queryInterface.sequelize.query(`ALTER TYPE ${enumNameWithSchema} ADD VALUE '${enumValue}'`);
    },

    down: (queryInterface, Sequelize) => {
        // whatever inside a schema or not, all enum in a database are stored inside a single location
        let query = `DELETE 
       FROM pg_enum 
       WHERE enumlabel = '${enumValue}'
       AND enumtypid IN ( SELECT oid FROM pg_type WHERE typname = '${enumName}')  
      `;

        return queryInterface.sequelize.query(query);
    }
};
