const passport = require('passport');
const login_verification = passport.authenticate('json', {
    failWithError: true,
    session: false
});

module.exports = (operation) => (req, res, next) => {
    switch (operation["x-operation"]) {
        // for sign, we must use another middleware
        case "signIn":
            login_verification(req, res, next);
            break;
        // special rules apply to this endpoint
        case "updateUser":
            handleUserUpdate(req, res, next);
            break;
        default:
            next();
    }
};

function handleUserUpdate(req, res, next) {
    const isAdmin = req.user.role === "admin";
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