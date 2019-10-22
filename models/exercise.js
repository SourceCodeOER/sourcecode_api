'use strict';

module.exports = (sequelize, DataTypes) => {
    let Exercise = sequelize.define('Exercise', {
        title : {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            defaultValue: ""
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // Enable optimistic locking.  When enabled, sequelize will add a version count attribute
        // to the model and throw an OptimisticLockingError error when stale instances are saved.
        // Set to true or a string with the attribute name you want to use to enable.
        version: true
    });

    Exercise.associate = function (models) {
        // An exercise is linked to a User
        models.Exercise.belongsTo(models.User, {
            as: "creator",
            foreignKey: "user_id"
        });
        // An exercise could have multiple tags
        models.Exercise.belongsToMany(models.Tag, {
            through: models.Exercise_Tag,
            timestamps: false,
            as: "tags",
            foreignKey: "exercise_id"
        })
    };

    return Exercise;
};