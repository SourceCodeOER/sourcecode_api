const models = require('../../models');
const Sequelize = require("sequelize");

module.exports = function (req, res, next) {
    models
        .User
        .findByPk(req.user.id, {
            attributes: {exclude: ['password']}
        })
        .then((user) => {
            res.json(user);
        })
        .catch(/* istanbul ignore next */
            err => next(err));
};