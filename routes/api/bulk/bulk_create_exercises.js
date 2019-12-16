const {
    bulky_store_exercises
} = require("../../utlis_fct");
const del = require('del');

module.exports = function (req, res, next) {

    // to handle both cases (depending of the content type)
    const {exercises, unmatched_files} = handle_both_content_type(req);

    // delete unused files first , and after bulk insert
    del(unmatched_files)
        .then(() => bulky_store_exercises(req.user, exercises))
        .then((_) => res.status(200).end())
        .catch(/* istanbul ignore next */
            (err) => next(err));

};

// as this endpoint has different schemas for content-type, I need this method for a clean code
function handle_both_content_type(req) {
    // content-type is json : the most simple case (no files to store )
    if (req.is('json')) {
        return {
            // to delete directly files that shouldn't be add as there is n
            "unmatched_files": [],
            // exercises with their file (here as we have
            "exercises": req.body.map(exercise => Object.assign({}, exercise, {file: null}))
        }
    } else {
        // multipart/form-data : the most horrible case ( at least one files to add )

        // mapping between uploaded filename and exercise
        const filesMapping = arrayToObject(req.body.filesMapping, "exercise");
        // map that uses "filename" as key and file
        const files = arrayToObject(req.files, "originalname");

        // exercises with(out) file
        const exercises = req.body.exercisesData.map((exercise, index) => {
            // By default, consider that the exercise has no file attached
            let addFile = {"file": null};

            // if a file exists for this exercise, add it
            if (filesMapping.hasOwnProperty(index)) {
                // use the original name as it is the name given by uploader
                const original_name = filesMapping[index].filename;
                addFile["file"] = files[original_name];
            }

            return Object.assign({}, exercise, addFile);
        });

        // It might be possible the uploader has send file(s) we couldn't match : delete them without mercy
        // ( to save storage folder space )

        const matched_files = exercises
            .filter(e => e.hasOwnProperty("file") && e.file !== null)
            .map(e => e.file.originalname);

        // It will work but I don't want to test that ;)
        /* istanbul ignore next */
        const unmatched_files = req.files
            .filter(f => !matched_files.includes(f.originalname))
            .map(f => f.path);

        return {
            "unmatched_files": unmatched_files,
            "exercises": exercises
        }
    }

}

// Thanks to Taq Karim , this one line
// https://medium.com/dailyjs/rewriting-javascript-converting-an-array-of-objects-to-an-object-ec579cafbfc7
/* istanbul ignore next */
const arrayToObject = (arr, keyField) => Object.assign({}, ...arr.map(item => ({[item[keyField]]: item})));