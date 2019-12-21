const models = require('../../models');
const Sequelize = require("sequelize");

module.exports = function (req, res, next) {
    models
        .User
        .findAll({
            attributes: [Sequelize.literal(1)],
            where: {
                role: "admin"
            },
            limit: 1
        }).then(hasAAdmin => {
        const user_role = (hasAAdmin.length === 0) ? "admin" : "user";
        return models
            .User
            .create({
                email: req.body.email,
                password: req.body.password,
                role: user_role,
                fullName: req.body.fullName
            }, {
                returning: false // no need to retrieve the created item as we simply care about insert
            });
    }).then(() => {
        res.status(200).end() // see
    }).catch(err => {
        // changes the error as it already exist
        err.status = 409;
        next(err)
    });
};