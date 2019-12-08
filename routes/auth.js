const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const models = require('../models');
const Sequelize = require("sequelize");

// for sign in
router.post('/login',
    passport.authenticate('json', {
        failWithError: true,
        session: false
    }),
    function (req, res) {
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
    }
);

// for register
router.post('/register',
    function (req, res, next) {
        models
            .User
            .findAll({
                attributes: [Sequelize.literal(1)],
                where: {
                    role: "admin"
                },
                limit: 1
            }).then(hasAAdmin => {
                const user_role = (hasAAdmin.length === 0) ? "admin" : "user";
                return models
                    .User
                    .create({
                        email: req.body.email,
                        password: req.body.password,
                        role: user_role,
                        fullName: req.body.fullName
                    }, {
                        returning: false // no need to retrieve the created item as we simply care about insert
                    });
        }).then(() => {
            res.status(200).end() // see
        }).catch(err => {
            // changes the error as it already exist
            err.status = 409;
            next(err)
        });
    }
);
module.exports = router;