// Sequelize for error handeling
const Sequelize = require("sequelize");
const debug = require("../controllers/_common/debug");

module.exports = function () {
    return function (err, req, res, next) {

        // looks nice ; found on some angular code
        let custom_err = new Error();
        // to check it is not an expected error of these
        let is_custom = true;
        switch (true) {
            case err instanceof Sequelize.EmptyResultError:
                // resource not found
                custom_err.message = "Resource not found";
                custom_err.status = 404;
                break;
            /* istanbul ignore next */
            case err instanceof Sequelize.DatabaseError:
                // constraints violations
                custom_err.message = "Problem with the database : Constraints not satisfied , etc";
                custom_err.status = 400;
                break;
            /* istanbul ignore next */
            case err instanceof Sequelize.ConnectionError:
                // Connection issues : cannot reach , timeout, etc
                custom_err.message = "The database cannot be reached : Please try later";
                custom_err.status = 503;
                break;
            /* istanbul ignore next */
            case err instanceof Sequelize.OptimisticLockError:
                // catch locking issues with version
                custom_err.message = "It seems you are using an outdated version of this resource : Operation denied";
                custom_err.status = 409;
                break;
            case err instanceof Sequelize.UniqueConstraintError:
                custom_err.message = "You violated a unique constraint and thus generated a conflict";
                custom_err.status = 409;
                break;
            /* istanbul ignore next */
            case err instanceof Sequelize.BaseError:
                // catch all unwatched exceptions coming from Sequelize
                custom_err.message = "Unexpected error";
                break;
            /* istanbul ignore next */
            default:
                is_custom = false;
                custom_err = Object.assign(err);
        }
        if (is_custom) {
            custom_err.is_custom = true;
            custom_err.dev_errors = [err];
        }
        // just log
        debug.tracker("%s %s - %d : %s",
            req.method,
            req.url,
            custom_err.status || 500,
            (req.is("json"))
                ? "application/json"
                : (req.is("multipart"))
                ? "multipart/*"
                : "urlencoded",
        );
        // if we want to inspect that later
        debug.errors("%O", err);
        next(custom_err)
    }
};