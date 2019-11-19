const express = require('express');
const router = express.Router();

const models = require('../../models');
const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// function for bulky inner select
const build_search_result = require("../utlis_fct").build_search_result;

router.get("/:exerciseId", (req, res, next) => {

    const id = parseInt(req.params.exerciseId, 10);

    // check if id exist in database
    return models
        .Exercise
        .findByPk(id,{
            attributes: [
                Sequelize.literal(1)
            ],
            rejectOnEmpty: true
        }).then((result) => {
            return build_search_result([id]);
        }).then(data => {
            // data is an array : I just need the first item
            res.json(data[0]);
        }).catch(err => {
            next(err);
        })

});

// TODO later secure that to prevent some mad genius to do stuff they can't
router.put("/:exerciseId", (req, res, next) => {
    // TODO
    next(new Error("NOT YET IMPLEMENTED"));
});

module.exports = router;