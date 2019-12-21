const models = require('../../../models');

// to prevent duplicates in database
const {find_tag_matches} = require("../../utlis_fct");

module.exports = (req, res, next) => {
    const creationDate = new Date();
    const {
        text,
        category_id
    } = req.body;

    // find tag matches for new_tags if already existing
    return find_tag_matches([{category_id, text}])
        .then(result => {
            // if no match, this is truly a new tag to be add ( otherwise do nothing )
            return (result.length > 0)
                ? Promise.resolve()
                : models
                    .Tag
                    .create({
                        text: text,
                        category_id: category_id,
                        // by default, consider a tag as not official
                        isValidated: false,
                        // some date
                        updateAt: creationDate,
                        createAt: creationDate
                    })
        })
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
};