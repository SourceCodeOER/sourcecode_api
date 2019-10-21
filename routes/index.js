const models  = require('../models');
const express = require('express');
const router  = express.Router();

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

module.exports = router;