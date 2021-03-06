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
    function exercise_metrics_hookFct(kind) {
        return function (notation, options) {
            // find the Exercise_Metrics related to this exercise with the AVG computed
            return Promise.all([
                // Find exercise metrics for given exercise
                notation
                    .sequelize
                    .models
                    .Exercise_Metrics
                    .findAll({
                        attributes: ["id", "vote_count"],
                        where: {
                            exercise_id: notation.exercise_id
                        },
                        transaction: options.transaction
                    }),
                // Find the new avg vote score
                notation
                    .sequelize
                    .models
                    .Notation
                    .findAll({
                        attributes: [
                            [Sequelize.fn("AVG", Sequelize.col("note")), "vote_score"]
                        ],
                        where: {
                            exercise_id: notation.exercise_id
                        },
                        group: ["exercise_id"],
                        transaction: options.transaction
                    })
            ]).then(
                ([[exercise_metrics], [result_in_db] ]) => {

                    // to handle both cases : the first notation created / other cases
                    const computed_metadata = {
                        vote_count: (kind === "insert")
                            ? exercise_metrics.get("vote_count") + 1
                            : exercise_metrics.get("vote_count"),
                        vote_score: (result_in_db !== undefined)
                            ? result_in_db.get("vote_score")
                            // by default, only one note was inserted for this exercise
                            // it should never happen but who knows what could happen ...
                            : /* istanbul ignore next */ notation.note
                    };

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
        exercise_metrics_hookFct("insert")
    );

    Notation.addHook(
        "afterUpdate",
        "exercise_metrics_updated",
        exercise_metrics_hookFct("update")
    );

    return Notation;
};