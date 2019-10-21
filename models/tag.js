'use strict';
// Par example "fill the code", "easy", "java"
module.exports = (sequelize, DataTypes) => {
    let Tag = sequelize.define("Tag", {
        text: DataTypes.STRING,
        isValidated: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // Enable optimistic locking.  When enabled, sequelize will add a version count attribute
        // to the model and throw an OptimisticLockingError error when stale instances are saved.
        // Set to true or a string with the attribute name you want to use to enable.
        version: true
    });

    Tag.associate = function (models) {
        // https://sequelize.org/master/manual/associations.html#belongsto
        // https://sequelize.org/master/class/lib/associations/belongs-to.js~BelongsTo.html
        models.Tag.belongsTo(models.TagKind);
    };

    return Tag;
};