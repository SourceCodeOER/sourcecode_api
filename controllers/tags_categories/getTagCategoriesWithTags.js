const models = require('../../models');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const {TAGS: TagState} = require("../_common/constants");

module.exports = function (req, res, next) {
    const params = req.query;

    const settings = {
        state: params.state || [],
        onlySelected: params.onlySelected /* istanbul ignore next */ || [],
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
                    "version"
                ],
                as: "tags",
                where: Object
                    .assign({},
                        ...(
                            (settings.state.length > 0)
                                /* istanbul ignore next */
                                ? [{
                                    state: {
                                        [Op.in]: settings.state.map(s => TagState[s] )
                                    }
                                }]
                                : []
                        )
                    )
            }
        ],
        order: [
            ["id", "ASC"]
        ]
    };

    return models
        .Tag_Category
        .findAll(options)
        .then(result => res.send(
            result.map(/* istanbul ignore next */cat => cat.toJSON()))
        )
        .catch(/* istanbul ignore next */
            err => next(err));
};
