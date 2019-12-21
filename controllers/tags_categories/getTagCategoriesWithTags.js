const models = require('../../models');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (req, res, next) {
    const params = req.query.settings || {};
    const settings = {
        state: params.state || "default",
        onlySelected: params.onlySelected || []
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
                ],
                where: (settings.state !== "default")
                    ? {
                        isValidated: settings.state === "validated"
                    }
                    : {}
            }
        ]
    };

    return models
        .Tag_Category
        .findAll(options)
        .then(result => res.json(result))
        .catch(/* istanbul ignore next */
            err => next(err));
};