'use strict';

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const enumObj = require("../controllers/_common/exercise_status");
let enumValues = Object.values(enumObj);

module.exports = (sequelize, DataTypes) => {
    let Exercise = sequelize.define('Exercise', {
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            defaultValue: ""
        },
        file: {
            type: DataTypes.STRING,
            allowNull: true
        },
        state: {
            type: DataTypes.ENUM(enumValues),
            allowNull: false,
            defaultValue: enumObj.CREATED
        },
        url: {
            type: DataTypes.STRING,
            allowNull: true
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
                        required: true,
                        as: "metrics",
                        where: whereConditionBuilder(parameters),
                        attributes: []
                    }]
                };
                // if the user provide a title / isValidated check , we must add it to the where clause
                if (parameters.hasOwnProperty("data")) {
                    let criteria = [];

                    /* istanbul ignore else */
                    if (parameters.data.hasOwnProperty("title")) {
                        criteria.push({
                            title: {
                                [Op.iLike]: `%${parameters.data.title}%`
                            }
                        });
                    }

                    if (parameters.data.hasOwnProperty("state") && parameters.data.state !== "DEFAULT") {
                        criteria.push({
                            state: enumObj[parameters.data.state]
                        });
                    }

                    if (parameters.data.hasOwnProperty("user_ids")) {
                        criteria.push({
                            user_id: {
                                [Op.in]: parameters.data["user_ids"]
                            }
                        });
                    }

                    // merge multiple criteria into the where
                    options.where = Object.assign({}, ...criteria);
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
                                ["avg_vote_score", "avg_score"]
                            ]
                        }
                    ]
                }
            },
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
        // An exercise could have multiple tags
        Exercise.belongsToMany(models.Tag, {
            through: models.Exercise_Tag,
            timestamps: false,
            as: "tags",
            foreignKey: "exercise_id"
        });
        // An exercise could have many tag entries
        Exercise.hasMany(models.Exercise_Tag, {
            as: "tag_entries",
            foreignKey: {
                name: "exercise_id",
                allowNull: false
            }
        });
        // An exercise is linked to a User
        Exercise.belongsTo(models.User, {
            as: "creator",
            foreignKey: {
                name: "user_id",
                allowNull: false
            },
            onDelete: "CASCADE"
        });
    };

    // when an exercise is created in database, automatically create a Exercise_Metrics row
    Exercise.addHook("afterCreate", "auto_create_exercise_metrics", function (exercise, options) {
        return exercise
            .sequelize
            .models
            .Exercise_Metrics
            .create({
                exercise_id: exercise.id
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
            return tagsWhereBuilder[kind](must_have, must_not)
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
        // title/isValidated criteria is handled somewhere else
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