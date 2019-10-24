'use strict';
module.exports = (sequelize, DataTypes) => {
    let TagKind = sequelize.define("Tag_Category", {
        kind: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // don't add the timestamp attributes (updatedAt, createdAt)
        timestamps: false
    });

    TagKind.associate = function (models) {
        // A Tag_Category can be used in multiple tags
        models.Tag_Category.hasMany(models.Tag, {
            as: "tags",
            foreignKey: {
                name: "category_id",
                allowNull: false
            }
        });
    };

    return TagKind;
};