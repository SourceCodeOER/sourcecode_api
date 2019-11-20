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
        Configuration.belongsToMany(models.Tag, {
            through: models.Configuration_Tag,
            foreignKey: {
                name: "configuration_id",
                allowNull: false
            }
        });
        // a configuration belongs to a user
        Configuration.belongsTo(models.User, {
            as: "User",
            foreignKey: {
                name: "user_id",
                allowNull: false
            },
            onDelete: "CASCADE"
        })
    };

    return Configuration;
};