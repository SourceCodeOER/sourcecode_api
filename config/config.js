const devConfig = {
    "username": "postgres",
    "password": "jy95",
    "host": "127.0.0.1",
    "dialect": "postgres",
    "database": "database_test",
    "schema": "exercises_library",
    "logging": false
};

let defaultConfig = {
    "dialect": "postgres",
    "logging": false,
    "use_env_variable": "DATABASE_URL"
};

// If a schema was specified
/* istanbul ignore else */
if (process.env.DATABASE_SCHEMA) {
    defaultConfig["schema"] = process.env.DATABASE_SCHEMA;
}

module.exports = {
    "development": devConfig,
    "production": defaultConfig,
    "test": defaultConfig
};
