const models = require('../../models');
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Default limit in this endpoint
const METADATA = {
    page: 1,
    size: 10
};

// Tags where condition builder
const simpleCase = (array, mustOverlap) => {
    return Sequelize.where(
        Sequelize.where(
            Sequelize.col("tags_ids"),
            Op.overlap,
            array
        ),
        Op.is,
        mustOverlap
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

// return ids of exercises that match
function find_exercises_ids_with_given_criteria(parameters, metadata) {
    // options for sequelize query builder
    let options = {
        attributes: ["id"],
        limit: metadata.size,
        offset: (metadata.page - 1) * metadata.size,
        // TODO soucis include
        include: [{
            model: models.Exercise_Metrics,
            as: "metrics",
            // TODO le where ?
            where: whereConditionBuilder(parameters)
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
    console.log("TEST 1");
    return models
        .Exercise
        .findAndCountAll(options)
}

// build the full result
function buildResult(params) {
    console.log("TEST 2");
    const {
        result: {count: totalItems, rows: exercise_ids},
        metadata: {page, size},
    } = params;
    return new Promise((resolve, reject) => {
        // TODO need sleep in order to code that
        const ids = exercise_ids.map(exercise => exercise.id);
        models
            .Exercise
            .findAll({
                // no need for that part here
                attributes: [
                    "id",
                    "title",
                    "description",
                    "version",
                    "createdAt",
                    "updatedAt"
                ],
                where: {
                    id: {
                        [Op.in]: ids
                    }
                },
                include: [
                    // load exercise evaluation
                    {
                        models: models.Exercise_Metrics,
                        as: "metrics",
                        through: {
                            attributes: [
                                ["vote_count", "votes"],
                                ["avg_vote_score", "avg_vote"]
                            ]
                        }
                    },
                    // load tags linked to this exercise ( with their category included )
                    {
                        models: models.Tag,
                        as: "tags",
                        through: {
                            attributes: [
                                "id",
                                "text"
                            ],
                            include: [
                                {
                                    models: models.Tag_Category,
                                    through: {
                                        attributes: [
                                            ["kind", "category"],
                                            ["id", "category_id"]
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }).then(data => {
            resolve({
                metadata: {
                    currentPage: page,
                    pageSize: size,
                    totalItems: totalItems,
                    totalPages: Math.ceil(totalItems / size)
                },
                data: data
            })
        }).catch(err => {
            reject(err);
        });
    });
}

module.exports = function (req, res, next) {

    // merge page criteria
    const updated_metadata = {...METADATA, ...(req.body.hasOwnProperty("metadata") ? req.body.metadata : {})};

    find_exercises_ids_with_given_criteria(req.body, updated_metadata)
        .then(result => {
            return buildResult({
                result: result,
                metadata: updated_metadata
            });
        }).then(result => {
            res.json(result);
    }).catch(err => {
        console.log(err);
        next(err);
    });
};