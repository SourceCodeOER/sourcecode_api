'use strict';

const Sequelize = require("sequelize");
const Promise = require("bluebird");

module.exports = (sequelize, DataTypes) => {
    let Notation = sequelize.define('Notation', {
        // no need for more ; as notes are usually between 0 and 5
        note: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: false
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // don't add the timestamp attributes (updatedAt, createdAt)
        timestamps: false
    });

    // common function for hooks
    function exercise_metrics_hookFct() {
        return function (notation, options) {
            // find the Exercise_Metrics related to this exercise with the AVG computed
            return Promise.all([
                // Find exercise metrics for given exercise
                notation
                    .sequelize
                    .models
                    .Exercise_Metrics
                    .findAll({
                        attributes: ["id"],
                        where: {
                            exercise_id: notation.exercise_id
                        }
                    }),
                // Find the new avg vote score
                notation
                    .sequelize
                    .models
                    .Notation
                    .findAll({
                        attributes: [
                            [Sequelize.fn("AVG", Sequelize.col("note")), "vote_score"],
                            [Sequelize.fn("COUNT", Sequelize.col("user_id")), "vote_count"]
                        ],
                        where: {
                            exercise_id: notation.exercise_id
                        },
                        group: ["exercise_id"]
                    })
            ]).then(
                ([[exercise_metrics], [result_in_db] ]) => {

                    // to handle both cases : the first notation created / other cases
                    const computed_metadata = {
                        vote_count: (result_in_db !== undefined)
                            ? result_in_db.get("vote_count")
                            : 1,
                        vote_score: (result_in_db !== undefined)
                            ? result_in_db.get("vote_score")
                            : notation.note // by default, only one note was inserted for this exercise
                    };
                    console.log(computed_metadata);

                    return notation
                        .sequelize
                        .models
                        .Exercise_Metrics
                        .update({
                            vote_count: computed_metadata.vote_count,
                            avg_vote_score: computed_metadata.vote_score
                        }, {
                            where: {id: exercise_metrics.id},
                            transaction: options.transaction
                        });
                });
        }
    }

    // after inserting / updating a row , we must update the related Exercise_Metrics
    // warning for seeding I must use that : https://github.com/sequelize/sequelize/issues/5053
    Notation.addHook(
        "afterCreate",
        "exercise_metrics_created",
        exercise_metrics_hookFct()
    );

    Notation.addHook(
        "afterUpdate",
        "exercise_metrics_updated",
        exercise_metrics_hookFct()
    );

    return Notation;
};