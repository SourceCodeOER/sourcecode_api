const passport = require('passport');
const chain = require('connect-chain-if');

// middleware
const check_user_role = require("./check_user_role");
const only_authenticated_user = passport.authenticate("jwt", {
    failWithError: true,
    session: false
});
const login_verification = passport.authenticate('json', {
    failWithError: true,
    session: false
});
const pass_middleware = function (req, res, next) {
    next();
};
const user_roles = ["guest", "user", "admin"];

// middleware
const common_middleware = (extracted_required_roles) => (req, res, next) => {
    chain([
        chain.if(
            // if not a guest, check credentials of this user
            !extracted_required_roles.includes("guest"),
            [
                only_authenticated_user,
                check_user_role(extracted_required_roles)
            ],
            pass_middleware,
        )
    ])(req, res, (err) => {
        if (err) {
            next(err);
        } else {
            next();
        }
    });
};


module.exports = () => (req, res, next) => {
    const operation = (req.operation) ? req.operation : {};
    // each controller has it own rules but some common behaviour can be inferred using the tags
    const extracted_required_roles = (operation.tags || []).filter(tag => user_roles.includes(tag));
    chain([
        // apply common
        chain.if(
            extracted_required_roles.length > 0,
            common_middleware,
            pass_middleware
        ),
        // if extra rules / middleware(s) should be used inside this controller
        chain.if(
            rules.hasOwnProperty(operation["x-controller"]),
            rules[operation["x-controller"]](operation),
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

// Additional Rule for endpoints
// Mostly useless from now but it can help if we have to add additional middleware(s)
const rules = {
    "auth": (operation) => (req, res, next) => {
        // for sign, we must use another middleware
        if (operation["x-operation"] === "signIn") {
            login_verification(req, res, next);
        } else {
            next();
        }
    },
    "bulk": (_operation) => (_req, _res, next) => {
        next();
    },
    "configurations": (_operation) => (_req, _res, next) => {
        next();
    },
    "exercises": (_operation) => (_req, _res, next) => {
        next();
    },
    "tags": (_operation) => (_req, _res, next) => {
        next();
    },
    "tags_categories": (_operation) => (_req, _res, next) => {
        next();
    }
};