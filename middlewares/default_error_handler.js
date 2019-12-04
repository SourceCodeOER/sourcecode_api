// no stacktraces leaked to user unless in development environment
module.exports = function (inDevelopment) {
    return function (err, req, res, next) {
        // if error thrown by validation, give everything else depending of the environment
        res.status(err.status /* istanbul ignore next */ || 500).json({
            message: err.message,
            errors: err.hasOwnProperty("errors")
                ? err.errors
                /* istanbul ignore next */
                : (inDevelopment && err.hasOwnProperty("is_custom")) ? err.dev_errors : [err]
        });
    }
};