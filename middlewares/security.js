const passport = require('passport');
const chain = require('connect-chain-if');
let {USERS} = require("../controllers/_common/constants");

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
// Add guest role for validation
const user_roles = Object.values(USERS).concat("guest");

/* istanbul ignore next */
function extract_required_roles(tags= []) {
    let requiredRoles = tags.filter(tag => user_roles.includes(tag));
    // an admin is also capable to do what a simple user can do
    if (requiredRoles.includes(USERS.USER)) {
        requiredRoles.push(USERS.ADMIN);
    }
    if (requiredRoles.includes(USERS.ADMIN)) {
        requiredRoles.push(USERS.SUPER_ADMIN);
    }
    return requiredRoles;
}

module.exports = () => (req, res, next) => {
    const operation = (req.operation) ? req.operation /* istanbul ignore next */ : {};

    // each controller has it own rules but some common behaviour can be inferred using some properties
    const extracted_required_roles = extract_required_roles(operation.tags);
    const needSecurity = operation.hasOwnProperty("security") && operation.security.every(s => s.hasOwnProperty("bearerAuth"));
    const bearerAuthProvided = (req.headers['Authorization'] || req.headers['authorization'] || undefined) !== undefined;

    const options = {operation, roles: extracted_required_roles, needSecurity, bearerAuthProvided};
    // run the middleware
    const subChain = main_middleware_chain(options);
    chain(subChain)(req, res, (err) => {
        if (err) {
            next(err);
        } else {
            next();
        }
    });
};

// operation.hasOwnProperty("security") && operation.security.every(s => s.hasOwnProperty("bearerAuth"))
// middleware chains
const main_middleware_chain = ({operation, roles, needSecurity, bearerAuthProvided}) => [
    // First check : if we need security or have a bearerAuth, we must check that
    chain.if(
        bearerAuthProvided || needSecurity,
        only_authenticated_user,
        pass_middleware
    ),
    // Second check : the type of user allowed in this endpoint
    chain.if(
        roles.length > 0 && !roles.includes("guest"),
        check_user_role(roles),
        pass_middleware
    ),
    // if extra rules / middleware(s) should be used inside this controller
    chain.if(
        rules.hasOwnProperty(operation["x-controller"]),
        rules[operation["x-controller"]](operation),
        pass_middleware
    )
];
