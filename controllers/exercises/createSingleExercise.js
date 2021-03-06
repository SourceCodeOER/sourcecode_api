const partition = require('lodash.partition');

// delegate tag matching process to specialized functions
const {
    find_tag_matches,
    matching_process,
    build_dictionary_for_matching_process,
    store_single_exercise
} = require("../_common/utlis_fct");


module.exports = function (req, res, next) {

    // distinguish already present tags from new tags
    const [already_present_tags, new_tags] = partition(req.body.tags, obj => Number.isInteger(obj));

    // did the user provide us a file to store ?
    const file = (req.files && req.files.exerciseFile) ? req.files.exerciseFile : null;

    // find tag matches for new_tags if already existing
    find_tag_matches(new_tags)
        .then(result => {
            // try to match them
            const tag_dictionary = build_dictionary_for_matching_process(result);
            return matching_process(already_present_tags, new_tags, tag_dictionary);
        })
        .then(
            ([existent_tags, really_new_tags]) => {
                return store_single_exercise(
                    req.user,
                    Object.assign({}, req.body, {
                            file: file
                        }
                    ),
                    existent_tags,
                    really_new_tags
                );
            }
        )
        .then(() => {
            res.status(200).end()
        })
        .catch(/* istanbul ignore next */
            err => next(err));
};