const models = require('../../models');

module.exports = (req, res, next) => {

    let options = {
        attributes: [
            "id",
            ["kind", "category"]
        ]
    };

    /*
    * If in any way the scope "count_summary" stop working ( should never happen but how knows ?)
    * Here is the raw query to got the same result :
    * */
    // SELECT
    //      "Tag_Category"."id",
    //      "Tag_Category"."kind" AS "category",
    //      COUNT(*) FILTER (WHERE "tags"."id" IS NOT NULL) AS "total",
    //      COUNT(*) FILTER (WHERE "tags"."state" = "VALIDATED") AS "total_validated",
    //      COUNT(*) FILTER(WHERE "tags"."state" = "NOT_VALIDATED") AS "total_unvalidated"
    //      COUNT(*) FILTER(WHERE "tags"."state" = "DEPRECATED") AS "total_deprecated"
    // FROM "exercises_library"."Tag_Categories" AS "Tag_Category"
    // LEFT OUTER JOIN "exercises_library"."Tags" AS "tags" ON "Tag_Category"."id" = "tags"."category_id"
    // GROUP BY "Tag_Category"."id", "Tag_Category"."kind";

    // Do we wish the simplest version of this endpoint or the most complex
    const withStats = req.query["fetchStats"] && req.query["fetchStats"] === 1;
    (
        (withStats)
            ? models.Tag_Category.scope("count_summary").findAll()
            : models.Tag_Category.findAll(options)
    )
        .then((result) => res.send(
            result.map(cat => {
                // Sequelize doesn't seem to map count variables into integer so I have to do that myself
                return (!withStats)
                    ? cat.toJSON()
                    : Object.assign({}, cat.toJSON(), {
                        "total": parseInt(cat.get("total")),
                        "total_validated": parseInt(cat.get("total_validated")),
                        "total_unvalidated": parseInt(cat.get("total_unvalidated")),
                        "total_deprecated": parseInt(cat.get("total_deprecated")),
                    });
            }))
        )
        .catch(/* istanbul ignore next */
            err => next(err));
};
