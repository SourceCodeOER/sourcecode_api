const models = require('../../models');
const Sequelize = require("sequelize");

module.exports = (req, res, next) => {
    return models
        .Configuration
        .findAll({
            attributes: {
                exclude: ["user_id"]
            },
            include: [{
                model: models.Tag,
                as: "Tags",
                attributes: [
                    ["id", "tag_id"],
                    ["text","tag_text"],
                    "category_id",
                    "isValidated",
                    "version"
                ],
                through: {
                    attributes: []
                },
                required: true,
            }],
            where: {
                user_id: req.user.id
            }
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