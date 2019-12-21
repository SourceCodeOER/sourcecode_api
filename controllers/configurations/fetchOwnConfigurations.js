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
                model: models.Configuration_Tag,
                as: "tags",
                attributes: ["tag_id"],
                required: true,
            }],
            where: {
                user_id: req.user.id
            }
        })
        .then(configurations =>
            res.json(
                configurations.map(
                    configuration => ({
                        name: configuration.get("name"),
                        title: configuration.get("title"),
                        id: configuration.get("id"),
                        tags: configuration.get("tags").map(tag => tag.get("tag_id"))
                    })
                )
            )
        )
        .catch(/* istanbul ignore next */
            err => next(err));
};