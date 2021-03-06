const Promise = require("bluebird");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const models = require('../../models');
const fileManager = require("../_common/files_manager");

module.exports = function (req, res, next) {

    return delete_exercises(req.body)
        .then(([files, _]) => {
            fileManager
                .delete_stored_files(files)
                .then(() => res.status(200).end());
        })
        .catch(/* istanbul ignore next */
            (err) => next(err));
};

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
