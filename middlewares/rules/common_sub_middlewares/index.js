// Arrays for check
const not_allowed_for_user = ["VALIDATED", "NOT_VALIDATED"];

module.exports = {
    // check if states given are allowed in this case
    check_exercise_state: function (states) {
        return (_req, _res, _next) => {
            /* istanbul ignore next */
            if (_req.user.role !== "admin" && states.some(state => not_allowed_for_user.includes(state))) {
                let error = new Error("FORBIDDEN");
                error.message = "It seems you tried to set a state reserved for admin  : " +
                    "This incident will be reported";
                error.status = 403;
                _next(error);
            } else {
                _next()
            }
        };
    },
    // Nothing to do
    pass_middleware: function (req, res, next) {
        next();
    }
};