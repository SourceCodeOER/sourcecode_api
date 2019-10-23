'use strict';
module.exports = (sequelize, DataTypes) => {
    let TagKind = sequelize.define("Tag_Kind", {
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
        // A Tag_Kind can be used in multiple tags
        models.Tag_Kind.hasMany(models.Tag, {
            as: "tags",
            foreignKey: {
                name: "category_id",
                allowNull: false
            }
        });
    };

    return TagKind;
};