'use strict';

module.exports = (sequelize, DataTypes) => {
    let Configuration = sequelize.define("Configuration",{
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },{
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // don't add the timestamp attributes (updatedAt, createdAt)
        timestamps: false
    });

    Configuration.associate = function (models) {
        // a configuration can use multiple tags
        models.Configuration.belongsToMany(models.Tag, {
            through: models.Configuration_Tag,
            foreignKey: "configuration_id"
        });
    };

    return Configuration;
};