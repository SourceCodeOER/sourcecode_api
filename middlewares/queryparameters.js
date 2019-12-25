// Fix to allow Array query parameters in url like generated in Postman (or other)
module.exports = function () {
    return (req, res, next) => {
        // After qs (or querystring ), we may need to do additional stuff
        if (Object.keys(req.query).length > 0) {
            // better type the variable inside req.query
            req.query = JSON.parse(
                JSON.stringify(req.query),
                (_key, val) => {
                    /* istanbul ignore if */
                    if (!isNaN(val)) {
                        return Number(val);
                    } else if (typeof val === "string" && val.startsWith("[") && val.endsWith("]")) {
                        const result = JSON.parse(val);
                        const parent = (Array.isArray(result)) ? [] /* istanbul ignore next */ : {};
                        // Set the prototype (needed for later)
                        return Object.assign(parent, result);
                    } else {
                        // maybe a JSON object : who know
                        try {
                            const converted = JSON.parse(val);
                            return converted;
                        }catch (e) {
                            return val;
                        }
                    }
                }
            );
            // To prevent other middelware (like openapi-enforcer ) to spy on query parameters directly
            // and do stuff I don't want
            req.url = req.url.split("?")[0];
            req.originalUrl = req.originalUrl.split("?")[0];
        }
        next();
    }
};