'use strict';
const Sequelize = require("sequelize");
const TagState = require("../controllers/_common/constants")["TAGS"];

module.exports = (sequelize, DataTypes) => {
    let Tag_Category = sequelize.define("Tag_Category", {
        kind: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration

        // don't add the timestamp attributes (updatedAt, createdAt)
        timestamps: false,

        // scopes : reuse more easily some common parts
        // https://sequelize.org/master/manual/scopes.html
        scopes: {

            // to get the following count
            // - the number of tags for a category
            // - the number of validated tags for a category
            // - the number of unvalidated tags for a category
            count_summary: function () {
                // to generate the FILTER count attribute since this issue is still active and solution not merged
                // https://github.com/sequelize/sequelize/issues/5732
                // I created a simpler version of the proposal ( maybe refactor this code when this feature is on)
                // more easier to do that PostgreSQL syntax directly that using litteral
                // even guys at Sequelize use that kind of trick for mysql sum
                // https://github.com/sequelize/sequelize/blob/master/test/integration/model/attributes/field.test.js#L483
                // https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-AGGREGATES
                const filterGen = (where) => Sequelize.literal(`COUNT(*) FILTER ${where}`);

                return {
                    attributes: [
                        "id",
                        ["kind", "category"],
                        [
                            filterGen(`(WHERE "tags"."id" IS NOT NULL)`),
                            "total"
                        ],
                        [
                            filterGen(`(WHERE "tags"."state" = "${TagState.VALIDATED}")`),
                            "total_validated"
                        ],
                        [
                            filterGen(`(WHERE "tags"."state" = "${TagState.NOT_VALIDATED}")`),
                            "total_unvalidated"
                        ],
                        [
                            filterGen(`(WHERE "tags"."state" = "${TagState.DEPRECATED}")`),
                            "total_deprecated"
                        ],
                    ],
                    group: ["Tag_Category.id", "Tag_Category.kind"],
                    include: [{
                        model: sequelize.models.Tag,
                        as: "tags",
                        attributes: []
                    }]
                }
            },
            // To fetch all tag categories in a object like
            // example: { "1" : "source", "2" : "institution", "3" : "auteur" }
            allTagsCategoriesAsObject: function () {
                return {
                    attributes: [
                        [
                            Sequelize.fn(
                                "json_object_agg",
                                Sequelize.col("id"),
                                Sequelize.col("kind")
                            ),
                            "categories"
                        ]
                    ]
                }
            }
        }
    });

    Tag_Category.associate = function (models) {
        // A Tag_Category can be used in multiple tags
        models.Tag_Category.hasMany(models.Tag, {
            as: "tags",
            foreignKey: {
                name: "category_id",
                allowNull: false,
            }
        });
    };

    return Tag_Category;
};
