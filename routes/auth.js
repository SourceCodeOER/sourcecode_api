const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// for sign in
router.post('/login',
    passport.authenticate('local', {
        failWithError: true
    }),
    function(req, res, next) {
        // For more information : http://www.passportjs.org/docs/authenticate/
        // `req.user` contains the authenticated user.
        res.json({
            token:  jwt.sign(
                {
                    id: req.user.id
                },
                process.env.SECRET_PHRASE || "Super secured passphrase"
            )
        });
    }
);

// for register
// TODO
module.exports = router;