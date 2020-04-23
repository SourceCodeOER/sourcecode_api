const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {

    jwt.verify(
        req.body.token,
        process.env.SECRET_PHRASE || "Super secured passphrase",
        (err, _) => {
            if (err) {
                next(err);
            } else {
                res.status(200).end();
            }
        }
    )

};
