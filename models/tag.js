'use strict';
// Par example "fill the code", "easy", "java"
module.exports = (sequelize, DataTypes) => {
    let Tag = sequelize.define("Tag", {
        text: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isValidated: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // Enable optimistic locking.  When enabled, sequelize will add a version count attribute
        // to the model and throw an OptimisticLockingError error when stale instances are saved.
        // Set to true or a string with the attribute name you want to use to enable.
        version: true
    });

    Tag.associate = function (models) {
        // a Tag must have a Tag Category
        models.Tag.belongsTo(models.Tag_Category, {
            as: "category",
            foreignKey: {
                name: "category_id",
                allowNull: false
            }
        });
        // a Tag can be used in multiple exercises
        models.Tag.belongsToMany(models.Exercise, {
            through: models.Exercise_Tag,
            timestamps: false,
            as: "exercises",
            foreignKey: "tag_id"
        });
        // a Tag can be used in multiple configurations
        models.Tag.belongsToMany(models.Configuration, {
            through: models.Configuration_Tag,
            foreignKey: "tag_id"
        })
    };

    return Tag;
};