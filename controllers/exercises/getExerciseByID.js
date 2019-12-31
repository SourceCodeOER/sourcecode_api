// function for bulky inner select
const models = require('../../models');
const {build_search_result} = require("../_common/utlis_fct");

const Sequelize = require("sequelize");

module.exports = (req, res, next) => {

    const id = parseInt(req.params.id, 10);
    // query parameters
    const options = (req.query["includeOptions"])
        ? Object
            .keys(req.query["includeOptions"])
            .reduce((acc, key) => {
                try {
                    acc[key] = JSON.parse(req.query["includeOptions"][key]);
                } finally {
                    // noinspection ReturnInsideFinallyBlockJS
                    return acc;
                }
            }, {})
        : undefined;


    // check if id exist in database
    return models
        .Exercise
        .findByPk(id, {
            attributes: [
                Sequelize.literal(1)
            ],
            rejectOnEmpty: true
        }).then((result) => {
            // If we have a user, we should try to fetch its vote for this exercise
            return Promise.all([
                build_search_result([id], options),
                (req.user) ? models.Notation.findAll({
                    attributes: [
                        ["note", "vote"]
                    ],
                    where: {
                        "exercise_id": id,
                        "user_id": req.user.id
                    }
                }) : []
            ]);
        }).then(([data, vote]) => {
            // data is an array : I just need the first item
            return res.send(
                (vote.length === 0)
                    ? data[0]
                    : Object.assign({}, data[0], {
                        vote: Number(vote[0].get("vote"))
                    })
            );
        }).catch(err => {
            next(err);
        })

};