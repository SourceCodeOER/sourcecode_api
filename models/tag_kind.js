'use strict';
module.exports = (sequelize, DataTypes) => {
    let TagKind = sequelize.define("TagKind", {
        kind: {
            type: DataTypes.ENUM([
                "programming_language",
                "difficulty" ,
                "exercise_type",
                "plateform",
                "topics",
                "organisation"
            ]),
            allowNull: false
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // don't add the timestamp attributes (updatedAt, createdAt)
        timestamps: false
    });

    TagKind.associate = function (models) {
        // https://sequelize.org/master/manual/associations.html#hasmany---belongstomany-association
        // https://sequelize.org/master/class/lib/associations/has-many.js~HasMany.html
        models.TagKind.hasMany(models.Tag);
    };

    return TagKind;
};