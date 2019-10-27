'use strict';

// This sub table is useful to save computation times for search
module.exports = (sequelize, DataTypes) => {
    let Exercise_Metrics = sequelize.define('Exercise_Metrics', {
        // to count how many votes for this exercise
        vote_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        // the average score
        avg_vote_score: {
            type: DataTypes.DECIMAL(3,2),
            defaultValue: 0.0,
            allowNull: false
        },
        // the tags ids, pre-retrieved so that search is faster
        tags_ids: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: false,
            defaultValue: []
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration
        timestamps: false,
        tableName: "Exercises_Metrics"
    });

    Exercise_Metrics.associate = function (models) {
        // each exercise has only one Exercise Metrics
        models.Exercise_Metrics.belongsTo(models.Exercise, {
            as: "exercise",
            foreignKey: {
                name: "exercise_id",
                allowNull: false
            }
        })
    };

    return Exercise_Metrics;
};