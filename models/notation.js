'use strict';

module.exports = (sequelize, DataTypes) => {
    let Notation = sequelize.define('Notation', {
        // no need for more ; as notes are usually between 0 and 5
        note: {
            type: DataTypes.DECIMAL(3,2),
            allowNull: false
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // don't add the timestamp attributes (updatedAt, createdAt)
        timestamps: false
    });
    
    // common function for hooks
    function exercise_metrics_hookFct(kind) {
        return function (notation, _) {
            // find the Exercise_Metrics related to this exercise with the AVG computed
            notation
                .sequelize
                .models
                .Exercise_Metrics
                // Query inspired by https://github.com/sequelize/sequelize/issues/3256#issuecomment-520705896
                .findOne({
                    where: {exercise_id: notation.exercise_id},
                    include: [
                        "id", "vote_count", {
                            model: notation.sequelize.models.Notation,
                            as: "notes",
                            attributes: [
                                notation.sequelize.fn("AVG", notation.sequelize.col("notes.note")), "vote_score"
                            ]
                        }
                    ],
                    subQuery: false,
                    group: "id"
                })
                .then(exercise_metrics => {
                    const new_vote_count = !(kind === "insert")
                        ? exercise_metrics.vote_count
                        : exercise_metrics.vote_count + 1;

                    return notation
                        .sequelize
                        .models
                        .Exercise_Metrics
                        .update({
                            vote_count: new_vote_count,
                            avg_vote_score: exercise_metrics.vote_score
                        }, {
                            where: {id: exercise_metrics.id}
                        });

                })
        }
    }
    
    // after inserting / updating a row , we must update the related Exercise_Metrics
    // warning for seeding I must use that : https://github.com/sequelize/sequelize/issues/5053
    Notation.addHook(
        "afterCreate",
        "exercise_metrics_created",
        exercise_metrics_hookFct("insert"));

    Notation.addHook(
        "afterUpdate",
        "exercise_metrics_updated",
        exercise_metrics_hookFct("update"));

    return Notation;
};