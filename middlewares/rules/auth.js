const passport = require('passport');
const login_verification = passport.authenticate('json', {
    failWithError: true,
    session: false
});

module.exports = (operation) => (req, res, next) => {
    if (operation["x-operation"] === "signIn") {
        login_verification(req, res, next);
    } else {
        next();
    }
};