const models = require('../../models');

module.exports = function (req, res, next) {
    const userId = req.body.id /* istanbul ignore next */ || req.user.id;
    let newProperties = {
        "email": req.body.email,
        "fullName": req.body.fullName,
    };

    /* istanbul ignore else */
    if (req.body.password) {
        newProperties["password"] = req.body.password;
    }

    /* istanbul ignore if */
    if (req.body.role) {
        newProperties["role"] = req.body.role;
    }

    return models
        .User
        .findByPk(userId)
        .then((user) => {
            return user.update(newProperties);
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
};