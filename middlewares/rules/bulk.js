const chain = require('connect-chain-if');
const {check_credentials_on_exercises} = require("../../controllers/_common/utlis_fct");

const pass_middleware = function (req, res, next) {
    next();
};

// Arrays for check
const check_credentials_endpoints = ["DeleteExercises", "ChangeExercisesStatus"];
const not_allowed_for_user = ["VALIDATED", "NOT_VALIDATED"];

module.exports = (operation) => (req, res, next) => {
    // some endpoints need additional verification before allowing access
    if (check_credentials_endpoints.includes(operation["x-operation"])) {

        chain([
            // First check that user is allowed to touch these exercises
            (_req, _res, _next) => {
                const ids = (check_credentials_endpoints[0] === operation["x-operation"])
                    ? _req.body
                    : _req.body.exercises;
                check_credentials_on_exercises(_req.user, ids)
                    .then(() => _next())
                    .catch((err) => _next(err));
            },
            // If endpoint === ChangeExercisesStatus, only user must endure another check
            chain.if(
                operation["x-operation"] === "ChangeExercisesStatus",
                (_req, _res, _next) => {
                    /* istanbul ignore next */
                    if (_req.user.role !== "admin" && not_allowed_for_user.includes(_req.body.state)) {
                        let error = new Error("FORBIDDEN");
                        error.message = "It seems you tried to set a state reserved for admin  : " +
                            "This incident will be reported";
                        error.status = 403;
                        _next(error);
                    } else {
                        _next()
                    }
                },
                pass_middleware
            )
        ])(req, res, (err) => {
            if (err) {
                next(err);
            } else {
                next();
            }
        });
    } else {
        next();
    }
};