const {USERS} = require("../../controllers/_common/constants");

module.exports = (operation) => (req, res, next) => {
    const action = operation["x-operation"];
    if (action === "updateUser") {
        handleUserUpdate(req, res, next);
    } else {
        next();
    }
};

function handleUserUpdate(req, res, next) {
    const isAdmin = req.user.role === USERS.SUPER_ADMIN;
    const prohibitedPropertiesForUser = ["id", "role"];

    if (isAdmin) {
        next();
    } else {
        const bypassCheck = Object
            .keys(req.body)
            .some(s => prohibitedPropertiesForUser.includes(s) );
        /* istanbul ignore else */
        if (bypassCheck){
            const err = new Error("Forbidden");
            err.message = "It seems you tried to bypass our security : this incident will be reported";
            err.status = 403;
            next(err);
        } else {
            next();
        }
    }
}
