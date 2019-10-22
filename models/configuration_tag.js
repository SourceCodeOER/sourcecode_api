'use strict';

module.exports = (sequelize, DataTypes) => {
    let ConfigurationTag = sequelize.define("Configuration_Tag", {
        // if we need another fields ( but probably not )
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration
        timestamps: false,
        tableName: "Configurations_Tags"
    });

    return ConfigurationTag;
};