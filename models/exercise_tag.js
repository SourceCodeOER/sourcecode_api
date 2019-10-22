'use strict';

module.exports = (sequelize, DataTypes) => {
    let ExerciseTag = sequelize.define("Exercise_Tag", {
        // TODO au cas ou il faudrait des attributs ( mais à priori non ;) )
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration
        timestamps: false,
    });

    return ExerciseTag;
};