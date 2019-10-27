const models  = require('../models');
const express = require('express');
const router  = express.Router();
const auth = require("./auth");

router.get('/', function(req, res) {
    res.json({"title": "HELLO WORLD"})
    /*
    models.User.findAll({
        include: [ models.Task ]
    }).then(function(users) {
        res.render('index', {
            title: 'Sequelize: Express Example',
            users: users
        });
    });
     */
});

// for auth sign/register endpoints
router.use("/auth", auth);

module.exports = router;