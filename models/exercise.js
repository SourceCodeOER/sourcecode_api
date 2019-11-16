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
        // An exercise can be evaluated multiples times
        Exercise.hasMany(models.Notation, {
            as: "notes",
            foreignKey: {
                name: "exercise_id",
                allowNull: false
            }
        });
        // An exercise has one metrics
        Exercise.hasOne(models.Exercise_Metrics, {
            as: "metrics",
            foreignKey: {
                name: "exercise_id",
                allowNull: false
            }
        });
    };

    // when an exercise is created in database, automatically create a Exercise_Metrics row
    Exercise.addHook("afterCreate", "auto_create_exercise_metrics", function(exercise, options) {
        return exercise
            .sequelize
            .models
            .Exercise_Metrics
            .create({
               exercise_id:  exercise.id
            }, {
                transaction: options.transaction
            });
    });

    return Exercise;
};