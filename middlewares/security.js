const passport = require('passport');
const chain = require('connect-chain-if');

// middleware
const check_user_role = require("./check_user_role");
// Additional Rule for endpoints
// Mostly useless from now but it can help if we have to add additional middleware(s)
const rules = require("./rules");
// common middleware(s)
const only_authenticated_user = passport.authenticate("jwt", {
    failWithError: true,
    session: false
});
const pass_middleware = function (req, res, next) {
    next();
};
const user_roles = ["guest", "user", "admin"];

// middleware
const common_middleware = (extracted_required_roles) => (req, res, next) => {
    const subChain = common_middleware_chain(extracted_required_roles);
    chain(subChain)(req, res, (err) => {
        if (err) {
            next(err);
        } else {
            next();
        }
    });
};

/* istanbul ignore next */
function extract_required_roles(tags= []) {
    let requiredRoles = tags.filter(tag => user_roles.includes(tag));
    // an admin is also capable to do what a simple user can do
    if (requiredRoles.includes("user")) {
        requiredRoles.push("admin");
    }
    return requiredRoles;
}

module.exports = () => (req, res, next) => {
    const operation = (req.operation) ? req.operation /* istanbul ignore next */ : {};
    // each controller has it own rules but some common behaviour can be inferred using the tags
    const extracted_required_roles = extract_required_roles(operation.tags);
    const subChain = main_middleware_chain(operation, extracted_required_roles);
    chain(subChain)(req, res, (err) => {
        if (err) {
            next(err);
        } else {
            next();
        }
    });
};

// middleware chains
const main_middleware_chain = (operation, extracted_required_roles) => [
    // apply common middleware
    chain.if(
        extracted_required_roles.length > 0,
        common_middleware(extracted_required_roles),
        pass_middleware
    ),
    // if extra rules / middleware(s) should be used inside this controller
    chain.if(
        rules.hasOwnProperty(operation["x-controller"]),
        rules[operation["x-controller"]](operation),
        pass_middleware
    )
];

const common_middleware_chain = (extracted_required_roles) => [
    chain.if(
        // if not a guest, check credentials of this user
        !extracted_required_roles.includes("guest"),
        [
            only_authenticated_user,
            check_user_role(extracted_required_roles)
        ],
        pass_middleware,
    )
];