const models = require('../../../models');
const fileManager = require("../../files_manager");

const Promise = require("bluebird");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (req, res, next) {
    return prevent_security_issue(req.user, req.body)
        .then(() => delete_exercises(req.body))
        .then(([files, destroyedRowNumber]) => {
            console.log("Successfully destroy row(s) " + destroyedRowNumber);
            fileManager
                .delete_stored_files(files)
                .then(() => res.status(200).end());
        })
        .catch(/* istanbul ignore next */
            (err) => next(err));
};

// As this endpoint is available for any type of user, we must prevent deletions of other exercise(s)
// if we aren't an admin
function prevent_security_issue({role, id}, exercises_ids) {
    return new Promise((resolve, reject) => {
        if (role === "admin") {
            resolve();
        } else {
            models
                .Exercise
                .findAll({
                    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('user_id')), 'user']],
                    where: {
                        id: {
                            [Op.in]: exercises_ids
                        }
                    }
                }, {
                    rejectOnEmpty: true
                })
                .then((exercises_creators) => {
                    const all_from_this_user = exercises_creators
                        .map(creator => creator.user)
                        .every((creator) => creator === id);

                    if (all_from_this_user) {
                        resolve();
                    } else {
                        let error = new Error("FORBIDDEN");
                        error.message = "It seems you tried to delete somebody else exercise(s) : " +
                            "This incident will be reported";
                        error.status = 403;
                        throw error;
                    }
                })
                .catch(/* istanbul ignore next */
                    (err) => reject(err));
        }
    })
}

function delete_exercises(exercises_ids) {
    // transaction here as if anything bad happens, we don't commit that to database
    // Here we need the serializable level because we should be able to prevent an user
    // to modify one of these exercises while we deleted them
    return models
        .sequelize
        .transaction({
            isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, (t) => {
            // first step : retrieve all stored files (if any)
            return models
                .Exercise
                .findAll({
                    attributes: ["file"],
                    where: {
                        file: {
                            [Op.ne]: null
                        },
                        id: {
                            [Op.in]: exercises_ids
                        }
                    }
                }, {
                    transaction: t
                }).then((files) => {
                    return Promise.all([
                        // return the filenames that should be deleted
                        Promise.resolve(
                            files.map(file => file.file)
                        ),
                        // delete exercises (and everything else related too)
                        models
                            .Exercise
                            .destroy({
                                force: true, // even if it is in paranoid mode ;)
                                transaction: t,
                                where: {
                                    id: {
                                        [Op.in]: exercises_ids
                                    }
                                }
                            })
                    ]);
                });
        });
}