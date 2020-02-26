const models = require('../../models');
const Sequelize = require("sequelize");

const TagState = require("../_common/constants")["TAGS"];

// to prevent duplicates in database
const {
    find_tag_matches,
    build_dictionary_for_matching_process,
    matching_process
} = require("../_common/utlis_fct");

module.exports = (req, res, next) => {
    const creationDate = new Date();

    // find the tags that really doesn't exist in database
    return find_tag_matches(req.body)
        .then(result => {
            // try to match them
            const tag_dictionary = build_dictionary_for_matching_process(result);
            return matching_process([], req.body, tag_dictionary);
        })
        .then(
            ([_, really_new_tags]) => {
                // bulky create the new tags into the systems
                return models
                    .sequelize
                    .transaction({
                        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
                    }, (t) => {
                        return models
                            .Tag
                            .bulkCreate(
                                really_new_tags.map(tag => {
                                    return {
                                        // if admin has set explicitly the isValidated
                                        state: (tag.hasOwnProperty("state"))
                                            ? TagState[tag.state]
                                            : TagState.NOT_VALIDATED,
                                        text: tag.text,
                                        category_id: tag.category_id,
                                        // some timestamps must be inserted
                                        updatedAt: creationDate,
                                        createdAt: creationDate
                                    }
                                }),
                                {
                                    transaction: t
                                }
                            );
                    })
            }
        )
        .then(() => res.status(200).end())
        .catch(/* istanbul ignore next */
            err => next(err));
};
