// routes
const express = require('express');
const router = express.Router();

// passport
const passport = require('passport');

// guarded router middleware
const only_authenticated_user = passport.authenticate("jwt", {
    failWithError: true,
    session: false
});

// endpoints
const login = require("./login");
const register = require("./register");
const me = require("./me");

// for sign in
router.post('/login',
    passport.authenticate('json', {
        failWithError: true,
        session: false
    }),
    login
);

// for register
router.post('/register', register);

// to get info on the current logged user
router.get("/me", only_authenticated_user, me);

module.exports = router;