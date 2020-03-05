'use strict';

const Sequelize = require("sequelize");
const env = process.env.NODE_ENV /* istanbul ignore next */ || 'development';
const debug = require(__dirname + '/../controllers/_common/debug');
const config = require(__dirname + '/../config/config.js')[env];
const createSchema = `
    DROP SCHEMA IF EXISTS ${config.schema} CASCADE;
    CREATE SCHEMA ${config.schema};
`;

try {
    let sequelize;
    /* istanbul ignore else */
    if (config.use_env_variable) {
        sequelize = new Sequelize(process.env[config.use_env_variable], config);
    } else {
        sequelize = new Sequelize(config.database, config.username, config.password, config);
    }

    sequelize
        .query(createSchema, {
            type: sequelize.QueryTypes.RAW
        })
        .then( () => {
            process.exit(0);
        })
        .catch( (err) => {
            debug.errors("%O", err);
            throw err;
        });

} catch (e) {
    process.exit(1);
}
