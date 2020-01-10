const models = require('../../models');

module.exports = (req, res, next) => {

    let options = {
        attributes: [
            "id",
            ["kind", "category"]
        ]
    };

    // Do we wish the simplest version of this endpoint or the most complex
    const withStats = req.query["fetchStats"]
        && !isNaN(req.query["fetchStats"])
        && parseInt(req.query["fetchStats"]) === 1;
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
                    });
            }))
        )
        .catch(/* istanbul ignore next */
            err => next(err));
};