"use strict";
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = (sequelize, DataTypes) => {
    let ExerciseTag = sequelize.define(
        "Exercise_Tag",
        {
            // if we need another fields ( but probably not )
        },
        {
            // https://sequelize.org/master/manual/models-definition.html#configuration
            timestamps: false,
            tableName: "Exercises_Tags"
        }
    );

    // after bulk insert of tags, we must update the "tags_ids" of given exercise(s)
    ExerciseTag.addHook(
        "afterBulkCreate",
        "auto_update_tags_exercise_metrics",
        (instances, options) => {
            // retrieve exercises ids of inserted row(s)
            const exercises_ids = [
                ...new Set(
                    instances.map(value => {
                        return value.exercise_id;
                    })
                )
            ];

            // computes the new tags array for each exercise
            ExerciseTag.findAll({
                attributes: [
                    "exercise_id",
                    [sequelize.fn("array_agg"), sequelize.col("tag_id"), "tags"]
                ],
                where: {
                    exercise_id: {
                        [Op.in]: exercises_ids
                    }
                },
                group: "exercise_id",
                transaction: options.transaction
            }).then(exercises_with_tags => {

                // bulk update
                return Promise.all(
                    exercises_with_tags.map(
                        (exercise) => {
                            return sequelize
                                .models
                                .Exercise_Metrics
                                .update({
                                    tags_ids: exercise.get("tags")
                                }, {
                                    where: exercise.get("exercise_id"),
                                    transaction: options.transaction
                                })
                        }
                    )
                )

            });
        }
    );

    return ExerciseTag;
};