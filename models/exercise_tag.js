'use strict';

module.exports = (sequelize, DataTypes) => {
    let ExerciseTag = sequelize.define("Exercise_Tag", {
        // if we need another fields ( but probably not )
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration
        timestamps: false,
        tableName: "Exercises_Tags"
    });

    return ExerciseTag;
};