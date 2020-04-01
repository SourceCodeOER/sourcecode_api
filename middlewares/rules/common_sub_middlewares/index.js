// Arrays for check
const {USERS, TAGS} = require("../../../controllers/_common/constants");
const not_allowed_for_user = [TAGS.VALIDATED, TAGS.NOT_VALIDATED];
const authorizedUsers = [USERS.ADMIN, USERS.SUPER_ADMIN];

// Create an Forbidden message
function create_forbidden_error() {
    let error = new Error("FORBIDDEN");
    error.message = "It seems you tried to set a state reserved for admin  : " +
        "This incident will be reported";
    error.status = 403;
    return error;
}

module.exports = {
    // check if states given are allowed in this case
    check_exercise_state: function (states) {
        return (_req, _res, _next) => {
            /* istanbul ignore next */
            if (!authorizedUsers.includes(_req.user.role) && states.some(state => not_allowed_for_user.includes(state))) {
                let error = create_forbidden_error();
                _next(error);
            } else {
                _next()
            }
        };
    },
    // check if given tag(s) are allowed in this case
    check_tags_state: function(tags) {
        return (_req, _res, _next) => {
            if (!authorizedUsers.includes(_req.user.role) && tags.some(tag => tag.hasOwnProperty("state")) ) {
                let error = create_forbidden_error();
                _next(error);
            } else {
                _next()
            }
        }
    },
    // Nothing to do
    pass_middleware: function (req, res, next) {
        next();
    }
};
