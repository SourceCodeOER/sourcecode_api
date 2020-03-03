const chain = require('connect-chain-if');
const {check_credentials_on_exercises, validated_tag_count} = require("../../controllers/_common/utlis_fct");
const {pass_middleware, check_exercise_state} = require("./common_sub_middlewares");

// Arrays for check
const check_credentials_endpoints = ["UpdateExercise", "createSingleExercise"];
const REQUIRED_NUMBER_OF_VALIDATED_TAGS = 3;

module.exports = (operation) => (req, res, next) => {
    // some endpoints need additional verification before allowing access
    chain([
        // First check that user is allowed to touch this exercise
        chain.if(
            operation["x-operation"] === "UpdateExercise",
            (_req, _res, _next) => {
                const id = parseInt(_req.params.id, 10);
                check_credentials_on_exercises(_req.user, [id])
                    .then(() => _next())
                    .catch(/* istanbul ignore next */
                        (err) => _next(err));
            },
            pass_middleware
        ),
        // Second check that user is allowed to use the given state
        chain.if(
            check_credentials_endpoints.includes(operation["x-operation"]),
            check_exercise_state([req.body.state].filter(s => s !== undefined)),
            pass_middleware
        ),
        // Third check that user have add at least 3 validated tags
        chain.if(
            check_credentials_endpoints.includes(operation["x-operation"]),
            (_req, _res, _next) => {
                const tags = _req.body.tags.filter(tag => !isNaN(tag));
                validated_tag_count(
                    tags,
                    REQUIRED_NUMBER_OF_VALIDATED_TAGS
                )
                    .then(() => _next())
                    .catch((err) => _next(err));
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
};
