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
            tableName: "Exercises_Tags",
            scopes: {
                // retrieve all the tags with their related category
                // why a function ? because the evaluation of the scope as a function is deferred.
                // https://github.com/sequelize/sequelize/issues/3963#issuecomment-153490510
                get_all_tags_with_related_category: function () {
                    return {
                        attributes: [
                            "exercise_id",
                            [
                                Sequelize.fn(
                                    "array_to_json",
                                    Sequelize.fn(
                                        "array_agg",
                                        Sequelize.fn(
                                            "json_build_object",
                                            "tag_id",
                                            Sequelize.col("tag_id"),
                                            "tag_text",
                                            Sequelize.col("Tag.text"),
                                            "category",
                                            Sequelize.fn(
                                                "json_build_object",
                                                "category_text",
                                                Sequelize.col("Tag->category.kind"),
                                                "category_id",
                                                Sequelize.col("Tag->category.id")
                                            )
                                        )
                                    )
                                ),
                                "tags"
                            ]
                        ],
                        include: [{
                            model: sequelize.models.Tag,
                            attributes: [],
                            required: true,
                            include: [{
                                model: sequelize.models.Tag_Category,
                                attributes: [],
                                as: "category",
                                required: true
                            }]
                        }],
                        group: "exercise_id"
                    }
                },
                filter_by_exercise_ids(ids) {
                    return {
                        where: {
                            exercise_id: {
                                [Op.in]: ids
                            }
                        }
                    }
                }
            }
        }
    );

    ExerciseTag.associate = function (models) {
        // An exercise could have multiple tags
        models.Exercise.belongsToMany(models.Tag, {
            through: ExerciseTag,
            timestamps: false,
            as: "tags",
            foreignKey: "exercise_id"
        });
        // a Tag can be used in multiple exercises
        models.Tag.belongsToMany(models.Exercise, {
            through: ExerciseTag,
            timestamps: false,
            as: "Exercises",
            foreignKey: "tag_id"
        });
        // reverse relation : One ExerciseTag is always related to one Tag
        ExerciseTag.hasOne(models.Tag, {
            foreignKey: "id",
            sourceKey: "tag_id"
        })
    };

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
            return ExerciseTag.findAll({
                attributes: [
                    "exercise_id",
                    [sequelize.fn("array_agg", sequelize.col("tag_id")), "tags"]
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
                                    where: {
                                        exercise_id: exercise.get("exercise_id")
                                    },
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