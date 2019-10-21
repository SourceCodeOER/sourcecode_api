const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// for sign in
router.post('/signIn',
    passport.authenticate('local'),
    function(req, res) {
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