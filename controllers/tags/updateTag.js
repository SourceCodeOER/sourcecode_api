const models = require('../../models');
const Sequelize = require("sequelize");

const tagState = require("../_common/constants")["TAGS"];

module.exports = (req, res, next) => {
    const {
        tag_id,
        tag_text,
        category_id,
        state,
        version
    } = req.body;

    // cannot use here findByPk as it ignores my where clause
    return models
        .Tag
        .findAll({
            where: {
                id: tag_id,
                version: version
            },
            rejectOnEmpty: true
        })
        .then(([instance]) => {
            return instance.update({
                category_id: category_id,
                text: tag_text,
                state: tagState[state]
            });
        })
        .then(() => {
            res.status(200).end();
        })
        .catch(/* istanbul ignore next */
            err => {
                if (err instanceof Sequelize.EmptyResultError) {
                    let error = new Error("Resource not found / Outdated version");
                    error.message = "It seems you are using an outdated version of this resource : Operation denied";
                    error.status = 409;
                    next(error);
                } else {
                    // default handler
                    next(err);
                }
            });
};
