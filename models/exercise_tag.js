"use strict";
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const difference = require('lodash.difference');

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
                },
                // to compute tags array
                tags_summary(/* istanbul ignore next */ options = {}) {
                    let settings = {
                        attributes: [
                            "exercise_id",
                            [sequelize.fn("array_agg", sequelize.col("tag_id")), "tags"]
                        ],
                        group: "exercise_id",
                        transaction: options.transaction
                    };
                    /* istanbul ignore next */
                    if (options.hasOwnProperty("transaction")) {
                        settings["transaction"] = options.transaction;
                    }
                    return settings;
                }
            }
        }
    );

    ExerciseTag.associate = function (models) {
        ExerciseTag.belongsTo(models.Tag, {
            foreignKey: {
                name: "tag_id",
                allowNull: false
            },
            targetKey: "id",
            onDelete: "CASCADE"
        });
        ExerciseTag.belongsTo(models.Exercise, {
            foreignKey: {
                name: "exercise_id",
                allowNull: false
            },
            targetKey: "id",
            onDelete: "CASCADE"
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
            return ExerciseTag
                .scope([
                    {method: ["filter_by_exercise_ids", exercises_ids]},
                    {method: ["tags_summary", options]}
                ])
                .findAll()
                .then(exercises_with_tags => {
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

    // When some tags are deleted ( or a category that contains tags )
    // We must update the "tags_ids" of given exercises
    ExerciseTag.addScope(
        "beforeBulkDestroy",
        "auto_remove_tags_exercise_metrics",
        (options) => {

            // first retrieve exercise(s) and tags id(s) impacted by this delete
            return sequelize
                .models
                .Exercise_Tag
                .findAll({
                    attributes: [
                        ["exercise_id", "exercise"],
                        ["tag_id", "tag"]
                    ],
                    where: options.where,
                    transaction: options.transaction
                })
                .then((rows) => {
                    const exercises = rows.map(r => r.get("exercise"));
                    const tags = rows.map(r => r.get("tag"));
                    return Promise.all([
                        // Exercise_Metrics for exercises that should be modified
                        sequelize
                            .models
                            .Exercise_Metrics
                            .findAll({
                                attributes: [
                                    ["exercise_id", "exercise"],
                                    ["tags_ids", "tags"]
                                ],
                                where: {
                                    exercise_id: {
                                        [Op.in]: exercises
                                    }
                                },
                                transaction: options.transaction
                            })
                        ,
                        // the tags that should be removed
                        tags,
                    ])
                })
                .then(([exercises_metrics, tagsToRemove]) => {
                    // Good point with this implementation :
                    // if there is no exercise with these tags, nothing extra will be done
                    return Promise.all(
                        exercises_metrics.map(metrics => {
                            // compute the tags changes and del with every case
                            // as empty array could occur, I must cast it every time to prevent an issue
                            const newTagArray = Sequelize.cast(
                                difference(metrics.get("tags"), tagsToRemove),
                                "ARRAY[]::integer[]"
                            );

                            // execute the change order
                            return sequelize
                                .models
                                .Exercise_Metrics
                                .update({
                                    tags_ids: newTagArray
                                }, {
                                    where: {
                                        exercise_id: metrics.get("exercise")
                                    },
                                    transaction: options.transaction
                                })
                        })
                    )
                })
        }
    );

    return ExerciseTag;
};