const models = require('../../models');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (req, res, next) {
    const params = req.query;
    const arrayOfIntegersOnly = (key) => (Array.isArray(params[key]))
        ? params[key].filter(s => !isNaN(s)).map(s => parseInt(s))
        : [];
    const onlyString = (key, defaultValue) => (typeof params[key] === "string")
        ? params[key]
        : defaultValue;

    const settings = {
        state: onlyString("state", "default"),
        onlySelected: arrayOfIntegersOnly("onlySelected")
    };

    let criteria = [];

    /* istanbul ignore if */
    if (settings.onlySelected.length > 0) {
        criteria.push({
            id: {
                [Op.in]: settings.onlySelected
            }
        });
    }

    let options = {
        attributes: [
            "id",
            ["kind", "category"]
        ],
        // dynamic create the where clause
        where: Object.assign({}, ...criteria),
        include: [
            {
                // by default, it will do a left join, just change that to a inner join
                required: true,
                model: models.Tag.scope('common_attributes'),
                as: "tags",
                where: Object
                    .assign({},
                        ...(
                            (settings.state !== "default")
                                /* istanbul ignore next */
                                ? [{isValidated: settings.state === "validated"}]
                                : []
                        )
                    )
            }
        ]
    };

    return models
        .Tag_Category
        .findAll(options)
        .then(result => res.send(
            result.map(/* istanbul ignore next */cat => cat.toJSON()))
        )
        .catch(/* istanbul ignore next */
            err => next(err));
};
