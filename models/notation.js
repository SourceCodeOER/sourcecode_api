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

    Notation.associate = function (models) {
        // if needed
    };

    return Notation;
};