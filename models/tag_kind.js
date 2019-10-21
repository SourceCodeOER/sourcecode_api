'use strict';
module.exports = (sequelize, DataTypes) => {
    let Tag_Kind = sequelize.define("TagKind", {
        kind: DataTypes.ENUM([
            "programming_language",
            "difficulty" ,
            "exercise_type",
            "plateform",
            "topics",
            "organisation"
        ])
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // don't add the timestamp attributes (updatedAt, createdAt)
        timestamps: false
    });

    Tag_Kind.associate = function (models) {
        // https://sequelize.org/master/manual/associations.html#hasmany---belongstomany-association
        // https://sequelize.org/master/class/lib/associations/has-many.js~HasMany.html
        models.Tag_Kind.hasMany(models.Tag);
    };

    return Tag_Kind;
};