const {Op} = require("sequelize");

const models = require('../../models');

const DEFAULT_SIZE_LIMIT = 10;
const DEFAULT_PAGE = 1;

module.exports = function (req, res, next) {
    const settings = {
        size: (req.query.metadata) ? req.query.metadata.size : DEFAULT_SIZE_LIMIT,
        page: (req.query.metadata) ? req.query.metadata.page : DEFAULT_PAGE,
        roles: req.query.roles /* istanbul ignore next */ || [],
        fullName: req.query.fullName || "",
        email: req.query.email || ""
    };

    // if additional filters were given
    let criteria = [];

    if (settings.roles.length > 0) {
        criteria.push({
            role: {
                [Op.in]: settings.roles
            }
        })
    }
    ["fullName", "email"]
        .filter(field => settings[field].length > 0)
        .forEach(field => {
            criteria.push({
                [field]: {
                    [Op.iLike]: `%${settings[field]}%`
                }
            });
        });

    let options = {
        limit: settings.size,
        offset: (settings.page - 1) * settings.size,
        attributes: [
            ["fullName", "fullName"],
            ["email", "email"],
            ["role", "role"],
            ["id", "id"]
        ],
        where: Object.assign({}, ...criteria)
    };

    return models
        .User
        .findAndCountAll(options)
        .then(({rows, count}) => {
            res.send({
                metadata: {
                    currentPage: settings.page,
                    pageSize: settings.size,
                    totalItems: count,
                    totalPages: Math.ceil(count / settings.size)
                },
                data: rows.map(row => row.toJSON())
            })
        }).catch(/* istanbul ignore next */
            err => next(err));
};
