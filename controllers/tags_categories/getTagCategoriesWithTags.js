const models = require('../../models');
const {Op, literal: SequelizeLitteral} = require("sequelize");
const {TAGS: TagState, EXERCISES} = require("../_common/constants");
// to map request exercise state(s) to column in database, as Sequelize cannot use views yet :(
// !! Should be rewritten one day !!
const mapToDb = {
    [EXERCISES.PENDING]: "total_pending",
    [EXERCISES.NOT_VALIDATED]: "total_not_validated",
    [EXERCISES.VALIDATED]: "total_validated",
    [EXERCISES.ARCHIVED]: "total_archived",
    [EXERCISES.DRAFT]: "total_draft",
};
const schema = models.sequelize.options.schema;
/* istanbul ignore next */
const WithSchema = (schema, table) => (schema) ? `"${schema}"."${table}"` : `"${table}"`;

module.exports = function (req, res, next) {
    const params = req.query;

    const settings = {
        state: params.state || [],
        onlySelected: params.onlySelected /* istanbul ignore next */ || [],
        countStates: params.countStates || Object.values(EXERCISES),
    };

    let criteria = [];

    /* istanbul ignore if */
    if (settings.onlySelected.length > 0) {
        criteria.push({
            id: {
                [Op.in]: settings.onlySelected
            }
        });
    }

    let options = {
        attributes: [
            "id",
            ["kind", "category"]
        ],
        // dynamic create the where clause
        where: Object.assign({}, ...criteria),
        include: [
            {
                // by default, it will do a left join, just change that to a inner join
                required: true,
                model: models.Tag,
                attributes: [
                    ["id", "tag_id"],
                    ["text", "tag_text"],
                    "category_id",
                    "state",
                    "version",
                    // Honestly it is quite of ugly but no choice : as explained, sequelize don't support views yet
                    [
                        SequelizeLitteral(`(
                            SELECT COALESCE(SUM(${settings.countStates.map(s => "stats." + mapToDb[s]).join(" + ")}) ,0)
                            FROM ${WithSchema(schema, "tags_by_exercise_state")} AS stats
                            WHERE stats.tag_id = tags.id
                        )`),
                        "total"
                    ]
                ],
                as: "tags",
                where: Object
                    .assign({},
                        ...(
                            (settings.state.length > 0)
                                /* istanbul ignore next */
                                ? [{
                                    state: {
                                        [Op.in]: settings.state.map(s => TagState[s])
                                    }
                                }]
                                : []
                        )
                    )
            }
        ],
        order: [
            ["id", "ASC"],
            //["tags.total", "DESC"]
        ]
    };

    return models
        .Tag_Category
        .findAll(options)
        .then(result => {
            let categories = result.map(cat => {
                let newCat = cat.toJSON();
                newCat["tags"] = newCat["tags"].map(tag => {
                    tag["total"] = Number(tag["total"]);
                    return tag;
                });
                return newCat;
            });
            res.send(categories);
        })
        .catch(/* istanbul ignore next */
            err => next(err));
};
