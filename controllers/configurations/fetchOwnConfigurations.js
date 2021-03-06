const models = require('../../models');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = (req, res, next) => {
    const params = req.query;
    const ids = params["ids"] || [];

    const tagAttributes = [
        ["id", "tag_id"],
        ["text", "tag_text"],
        "category_id",
        "state",
        "version"
    ];

    let whereConditions = [];
    // at least fetch only the ones for users
    whereConditions.push({
        user_id: req.user.id
    });

    if (ids.length > 0) {
        whereConditions.push({
            id: {
                [Op.in]: ids
            }
        })
    }

    return models
        .Configuration
        .findAll({
            attributes: {
                exclude: ["user_id"]
            },
            include: [{
                model: models.Tag,
                as: "Tags",
                attributes: tagAttributes,
                through: {
                    attributes: []
                },
                required: false,
            }],
            where: Object.assign({}, ...whereConditions),
            order: [
                ["id", "ASC"]
            ]
        })
        .then(configurations =>
            res.send(
                configurations.map(
                    configuration => ({
                        name: configuration.get("name"),
                        title: configuration.get("title"),
                        id: configuration.get("id"),
                        tags: configuration.get("Tags").map(tag => tag.toJSON())
                    })
                )
            )
        )
        .catch(/* istanbul ignore next */
            err => next(err));
};
