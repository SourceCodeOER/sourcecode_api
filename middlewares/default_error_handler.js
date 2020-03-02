// no stacktraces leaked to user unless in development environment
module.exports = function (inDevelopment) {
    return function (err, req, res, next) {
        // if error thrown by validation, give everything else depending of the environment
        const shouldGiveFullContext = (inDevelopment /* istanbul ignore next */ && err.hasOwnProperty("is_custom"));
        const { dev_errors, ...rest } = err;
        const errors = (shouldGiveFullContext) /* istanbul ignore next */ ? err.dev_errors : [rest];
        res.status(err.status /* istanbul ignore next */ || 500).json({
            message: err.message,
            errors: errors
        });
    }
};
