const passport = require('passport');
const chain = require('connect-chain-if');

const check_user_role = require("../middlewares/check_user_role");
const only_authenticated_user = passport.authenticate("jwt", {
    failWithError: true,
    session: false
});
const login_verification = passport.authenticate('json', {
    failWithError: true,
    session: false
});

module.exports = function (app) {

    // for auth endpoints
    app.use('/auth/login', login_verification);
    app.use("/auth/me", only_authenticated_user);

    // for configuration endpoints
    app.use("/api/configurations", only_authenticated_user);

    // for tags endpoints
    app.use("/api/tags", (req, res, next) => {
        switch (req.method) {
            // no security for GET
            case "GET":
                next();
                break;
            // create a Tag proposal : required an account
            case "POST":
                only_authenticated_user(req, res, next);
                break;
            // modify a Tag : required an admin account
            case "PUT":
                chain([
                    only_authenticated_user,
                    check_user_role(["admin"])
                ])(req, res, (err) => {
                    if (err) {
                        next(err);
                    } else {
                        next();
                    }
                });
                break;
            default:
                // do nothing
                next();
        }
    });

    // for tags_categories endpoints : only one sub endpoint is secured for admin
    app.use("/api/tags_categories", (req, res, next) => {
            if( ["PUT","UPDATE","DELETE"].includes(req.method) ) {
                chain([
                    only_authenticated_user,
                    check_user_role(["admin"])
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
        }
    );

    // for exercises endpoints
    app.use("/api/create_exercise", only_authenticated_user);
    app.use("/api/exercises/:exerciseId", (req, res, next) => {
        if (req.method === "GET") {
            next();
        } else {
            only_authenticated_user(req, res, next);
        }
    });
    app.use("/api/vote_for_exercise", only_authenticated_user);
    app.use("/api/create_exercise", only_authenticated_user);

    // for bulk endpoints
    app.use("/api/bulk", only_authenticated_user);
    app.use("/api/bulk/modify_exercises_validity", check_user_role(["admin"]));
    app.use("/api/bulk/create_or_find_tag_categories", check_user_role(["admin"]));

};