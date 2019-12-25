module.exports = function () {
    return (req, res, next) => {
        // workaround to correctly convert
        if (req.is("multipart")) {
            const original_properties = Object
                .entries(req.body)
                .filter(([_key, value]) =>
                    Buffer.isBuffer(value)
                    ||
                    (Array.isArray(value) && value.every(file => Buffer.isBuffer(file)))
                )
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
            const keys = Object.keys(original_properties);
            const other_keys = Object.keys(req.body).filter(key => !keys.includes(key));
            const obj = other_keys.reduce((acc, key) => {
                acc[key] = req.body[key];
                return acc;
            }, {});
            const converted_properties = JSON.parse(
                JSON.stringify(obj),
                (_key, value) => {
                    return (!isNaN(value)) ? Number(value) : value;
                }
            );
            req.body = Object.assign({}, original_properties, converted_properties);
        }
        next();
    }
};