const jwt = require('jsonwebtoken');

module.exports = function (req, res) {
    // For more information : http://www.passportjs.org/docs/authenticate/
    // `req.user` contains the authenticated user.
    res.json({
        token: jwt.sign(
            {
                id: req.user.id
            },
            process.env.SECRET_PHRASE || "Super secured passphrase"
        ),
        user: {
            role: req.user.role,
            fullName: req.user.fullName
        }
    });
};