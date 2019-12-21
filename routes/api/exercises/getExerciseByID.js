// function for bulky inner select
const models = require('../../../models');
const {build_search_result} = require("../../utlis_fct");

const Sequelize = require("sequelize");

module.exports = (req, res, next) => {

    const id = parseInt(req.params.exerciseId, 10);

    // check if id exist in database
    return models
        .Exercise
        .findByPk(id, {
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

};