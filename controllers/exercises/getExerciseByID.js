// function for bulky inner select
const models = require('../../models');
const {build_search_result} = require("../_common/utlis_fct");
const exerciseState = require("../_common/constants")["EXERCISES"];

module.exports = (req, res, next) => {

    const id = parseInt(req.params.id, 10);
    // query parameters
    const options = (req.query["includeOptions"]) ? req.query["includeOptions"] : undefined;

    // check if id exist in database
    return models
        .Exercise
        .findByPk(id, {
            attributes: [
                ["user_id", "user"],
                ["state", "state"]
            ],
            rejectOnEmpty: true
        }).then((result) => {
            return new Promise((resolve, reject) => {
                // If exercise is ARCHIVED and this exercise was not access by its creator or admin,
                // a HTTP error should occur
                if (result.get("state") === exerciseState.ARCHIVED) {
                    const passCriteria = [
                        req.user && req.user.role === "admin",
                        req.user && req.user.role !== "admin" && result.get("user") === req.user.id,
                    ];
                    if (passCriteria.includes(true)) {
                        resolve();
                    } else {
                        let error = new Error("GONE");
                        error.message = "This exercise was archived and thus no more publicly visible";
                        error.status = 410;
                        reject(error);
                    }
                } else {
                    resolve();
                }
            });
        }).then((_) => {
            // If we have a user, we should try to fetch its vote for this exercise
            return Promise.all([
                build_search_result([id], options, req.query),
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
