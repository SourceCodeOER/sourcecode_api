'use strict';

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

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
        version: true,

        // scopes : reuse more easily some common parts
        // https://sequelize.org/master/manual/scopes.html
        scopes: {

            // to find exercise(s) that match criteria
            find_exercises_ids_with_given_criteria([parameters, metadata]) {
                // options for sequelize query builder
                let options = {
                    attributes: ["id"],
                    limit: metadata.size,
                    offset: (metadata.page - 1) * metadata.size,
                    include: [{
                        model: sequelize.models.Exercise_Metrics,
                        as: "metrics",
                        where: whereConditionBuilder(parameters),
                        attributes: []
                    }]
                };
                // if the user provide a title, we must add it to the where clause
                // maybe later think of a way to have a more clean code
                if (parameters.hasOwnProperty("data") && parameters.data.hasOwnProperty("title")) {
                    options.where = {
                        title: {
                            [Op.iLike]: `%${parameters.data.title}%`
                        }
                    }
                }
                return options;
            },
            // for bulky query, default attributes to show
            default_attributes_for_bulk: {
                attributes: {
                    exclude: ["user_id"]
                }
            },
            // filter exercises ids
            filter_exercises_ids(ids) {
                  return {
                      where: {
                          id: {
                              [Op.in]: ids
                          }
                      }
                  }
            },
            // include the metrics part
            with_exercise_metrics() {
                return {
                    include: [
                        // load exercise evaluation
                        {
                            model: sequelize.models.Exercise_Metrics,
                            as: "metrics",
                            required: true,
                            attributes: [
                                ["vote_count", "votes"],
                                ["avg_vote_score", "avg_vote"]
                            ]
                        }
                    ]
                }
            },
            // to build the final result
            // for simplicity, we can invoke the scope ONLY when there is at least ONE item in ids
            // if not, don't use that
            exercise_with_metrics_and_tags_and_categories_related() {
                return {
                    include: [
                        // load tags linked to this exercise ( with their category included )
                        // required : true for inner join (by default, it uses left outer join which is bad )
                        {
                            model: sequelize.models.Tag,
                            as: "tags",
                            required: true,
                            // credits to Stackoverflow : https://stackoverflow.com/a/45093383/6149867
                            through: {attributes: []}, //<-- this line will prevent mapping object from being added
                            attributes: [
                                ["id", "tag_id"],
                                ["text", "tag_text"]
                            ],
                            include: [
                                {
                                    model: sequelize.models.Tag_Category,
                                    as: "category",
                                    required: true,
                                    attributes: [
                                        ["id", "category_id"],
                                        ["kind", "category_text"]
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        }
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

// utilities function for scopes

// Tags where condition builder
const simpleCase = (array, mustBePresent) => {
    // positive tags : 2 OR 3 OR 4 , etc...
    // negative tags : NOT 2 OR NOT 3 , etc...
    return Sequelize.where(
        // for negative check, we should use contains instead
        // For example (using the examples above) :
        //   For positive check : tags_ids && [2,3,4]
        //   For negative check : tags_ids @> [2,3]
        Sequelize.where(
            Sequelize.col("tags_ids"),
            (mustBePresent) ? Op.overlap : Op.contains,
            array
        ),
        Op.is,
        mustBePresent
    )
};
const tagsWhereBuilder = {
    "simpleCase": simpleCase,
    "complexCase": (must_have, must_not) => ({
        [Op.or]: [
            simpleCase(must_have, true),
            simpleCase(must_not, false),
        ]
    })
};

// tag condition builder
function tagsConditionsBuilder(tags) {

    const conditions = tags.map(tagOrTags => {

        // filter negative/positive integer(s) into array ( more efficient to check that way )
        const must_have = Array.isArray(tagOrTags)
            ? tagOrTags.filter(tag => tag >= 0)
            : tagOrTags >= 0
                ? [tagOrTags]
                : [];
        const must_not = Array.isArray(tagOrTags)
            ? tagOrTags.filter(tag => !(tag >= 0)).map(tag => -tag)
            : tagOrTags >= 0
                ? []
                : [-tagOrTags];

        // multiple case can occur because of the mixin of must_have / must_not checks
        // One is these case is mandatory true
        const kind = (must_not.length > 0 && must_have.length > 0) ? "complexCase" : "simpleCase";

        // in simple case, we only care about
        if (kind === "simpleCase") {
            return tagsWhereBuilder[kind](
                (must_have.length > 0) ? must_have : must_not,
                // simplification : if must_have is not empty, mustOverlap will be true , otherwise false (must_not)
                must_have.length > 0
            )
        } else {
            // the most horrible case
            return tagsConditionsBuilder[kind](must_have, must_not)
        }

    });

    // as the expression is in Conjunctive Normal Form, we know we can combine AND and OR formulas
    return {
        [Op.and]: conditions
    };
}

// where condition builder for find_exercises_ids_with_given_criteria
function whereConditionBuilder(parameters) {

    // does the user provide us filter criteria
    if (parameters.hasOwnProperty("data")) {

        // maybe find a better way to generate that part
        const data = parameters.data;
        const counter = Object.keys(data).length;

        // no tags criteria given, simple case : just the join condition
        // title criteria is handled somewhere else
        if (counter === 0 || !data.hasOwnProperty("tags")) {
            return {}
        } else {
            // we have at least a tag criteria
            return {
                [Op.and]: [
                    tagsConditionsBuilder(data.tags)
                ]
            }
        }
    } else {
        // no criteria given, simple case : just the join condition
        return {}
    }
}