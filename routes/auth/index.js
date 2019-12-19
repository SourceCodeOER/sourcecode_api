// routes
const express = require('express');
const router = express.Router();

// passport
const passport = require('passport');

// endpoints
const login = require("./login");
const register = require("./register");

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

module.exports = router;