const models = require('../../models');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (req, res, next) {
    // TODO Fix of OpenApi validator to full test this endpoint
    const settings = {
        state: req.query.state || "default",
        onlySelected: req.query.onlySelected || []
    };

    let options = {
        attributes: [
            "id",
            ["kind", "category"]
        ],
        where: (settings.onlySelected.length > 0)
            ? {
                id: {
                    [Op.in]: settings.onlySelected
                }
            }
            : {},
        include: [
            {
                // by default, it will do a left join, just change that to a inner join
                required: true,
                model: models.Tag,
                as: "tags",
                attributes: [
                    ["id", "tag_id"],
                    ["text", "tag_text"]
                ]
            }
        ]
    };

    return models
        .Tag_Category
        .findAll(options)
        .then(result => res.json(result))
        .catch(err => next(err));
};