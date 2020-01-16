'use strict';

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const enumObj = require("../controllers/_common/exercise_status");
let enumValues = Object.values(enumObj);

// Useful for vote filtering (and maybe other things later)
const OPERATIONS = {
    "<=": Op.lte,
    "<": Op.lt,
    ">=": Op.gte,
    ">": Op.gt
};

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
            defaultValue: enumObj.DRAFT
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

            // to deal with the horrible order by clauses generically generated
            orderByClauses(fields) {
                // To handle order by clauses
                // the last item in the values array will be the choice of the user (instead of the '')
                const ORDER_BY_FIELDS = {
                    "state": ["state", ''],
                    "id": ["id", ''],
                    "title": ["title", ''],
                    "date": ['updatedAt', ''],
                    "avg_score": [
                        {model: sequelize.models.Exercise_Metrics, as: "metrics"},
                        'avg_vote_score',
                        ''
                    ],
                    "vote_count": [
                        {model: sequelize.models.Exercise_Metrics, as: "metrics"},
                        'vote_count',
                        ''
                    ],
                };
                return {
                    order: fields.map(field => {
                        let order_by_clause = ORDER_BY_FIELDS[field.field];
                        // Remove the last empty value so that we can add
                        order_by_clause.pop();
                        order_by_clause.push(field.value);
                        return order_by_clause;
                    })
                };
            },
            // to find exercise(s) that match criteria
            find_exercises_ids_with_given_criteria([parameters, metadata]) {
                // options for sequelize query builder
                let options = {
                    attributes: ["id"],
                    // need to have access to metrics for some filtering stuff
                    include: [{
                        model: sequelize.models.Exercise_Metrics,
                        required: true,
                        as: "metrics",
                        where: whereConditionBuilder(parameters),
                        attributes: []
                    }]
                };
                // if metadata were given
                /* istanbul ignore else */
                if (metadata) {
                    options["limit"] = metadata.size;
                    options["offset"] = (metadata.page - 1) * metadata.size;
                }
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

                    if (parameters.data.hasOwnProperty("state")) {
                        criteria.push({
                            state: {
                                [Op.in]: parameters.data.state.map(s => enumObj[s])
                            }
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
            // if we want to exclude the description for bulky query
            without_exercise_description: {
                attributes: {
                    exclude: ["description"]
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
            // include the creator of the exercise
            with_exercise_creator() {
                return {
                    include: [
                        // include basic information on exercise creator
                        {
                            model: sequelize.models.User,
                            as: "creator",
                            required: true,
                            attributes: [
                                ["fullName", "fullName"],
                                ["email", "email"]
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

// properties we need to check for whereConditionBuilder
const metricsPropertiesToCheck = ["tags", "vote"];

// where condition builder for find_exercises_ids_with_given_criteria
function whereConditionBuilder(parameters) {

    // does the user provide us filter criteria
    if (
        (!parameters.hasOwnProperty("data"))
        ||
        metricsPropertiesToCheck
            .map(key => parameters.data.hasOwnProperty(key))
            .every(b => !b)
    ) {
        return {}
    } else {
        // at least one criteria was given
        const data = parameters.data;
        const criteria = [];

        // tag criteria was given
        /* istanbul ignore else */
        if (data.hasOwnProperty("tags")) {
            criteria.push(
                tagsConditionsBuilder(data.tags)
            );
        }

        // vote criteria was given
        if (data.hasOwnProperty("vote")) {
            const {operator, value} = data.vote;
            criteria.push(
                Sequelize.where(
                    Sequelize.col("avg_vote_score"),
                    OPERATIONS[operator],
                    value
                )
            )
        }

        // at least one criteria was given because of the executed path
        return {
            [Op.and]: criteria
        };
    }
}
