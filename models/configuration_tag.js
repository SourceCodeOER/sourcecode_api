'use strict';

module.exports = (sequelize, DataTypes) => {
    let ConfigurationTag = sequelize.define("Configuration_Tag", {
        // if we need another fields ( but probably not )
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration
        timestamps: false,
        tableName: "Configurations_Tags"
    });

    ConfigurationTag.associate = function (models) {
        ConfigurationTag.belongsTo(models.Tag, {
            foreignKey: {
                name: 'tag_id',
                allowNull: false
            },
            targetKey: 'id',
            as: 'Tag'
        });
        ConfigurationTag.belongsTo(models.Configuration, {
            foreignKey: {
                name: 'configuration_id',
                allowNull: false
            },
            targetKey: 'id',
            as: 'Configuration'
        });
    };

    return ConfigurationTag;
};