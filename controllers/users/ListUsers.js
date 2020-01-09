const models = require('../../models');

const DEFAULT_SIZE_LIMIT = 10;
const DEFAULT_PAGE = 1;

module.exports = function (req, res, next) {
    let size = (req.query.metadata) ? parseInt(req.query.metadata.size) : DEFAULT_SIZE_LIMIT;
    let page = (req.query.metadata) ? parseInt(req.query.metadata.page) : DEFAULT_PAGE;

    let options = {
        limit: size,
        offset: (page - 1) * size,
        attributes: [
            ["fullName", "fullName"],
            ["email", "email"],
            ["role", "role"],
            ["id", "id"]
        ]
    };

    return models
        .User
        .findAndCountAll(options)
        .then(({rows, count}) => {
            res.send({
                metadata: {
                    currentPage: page,
                    pageSize: size,
                    totalItems: count,
                    totalPages: Math.ceil(count / size)
                },
                data: rows.map(row => row.toJSON())
            })
        }).catch(/* istanbul ignore next */
            err => next(err));
};