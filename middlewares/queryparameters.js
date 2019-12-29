module.exports = function () {
    return (req, res, next) => {
        // After qs (or querystring ), we may need to do additional stuff
        if (Object.keys(req.query).length > 0) {
            // disable openapi-enforcer validation of query parameters
            req.url = req.url.split("?")[0];
            req.originalUrl = req.originalUrl.split("?")[0];
        }
        next();
    }
};