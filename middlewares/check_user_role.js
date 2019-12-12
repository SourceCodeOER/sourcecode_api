// allowedTypeArray is an array with all allowed types of user that can
module.exports = function (allowedTypeArray) {
    /* istanbul ignore next */
    return function (req, res, next) {
        if (allowedTypeArray.includes(req.user.role)) {
            next();
        } else {
            let err = new Error('FORBIDDEN');
            err.message = `You are not allowed on this endpoint`;
            err.status = 403;
            next(err);
        }
    }
};