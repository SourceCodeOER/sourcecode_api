const Promise = require("bluebird");
const moveFile = require('move-file');
const del = require('del');
const {resolve: path_resolve} = require("path");
const {FILES_FOLDER} = require("../../config/storage_paths");
const debug = require("./debug");

// function to remove given files array
// if it is a multer object, we can extract the storage (else rely on given paths )
// even if delete failed, we will say that it works : the simple reason is that then/catch will have the same content
/* istanbul ignore next */
function delete_files(filesArray, isMulterObject = true) {
    const paths = (isMulterObject)
        ? filesArray.map(file => file.path)
        : filesArray;
    return new Promise((resolve) => {
        del(paths)
            .then(() => resolve())
            .catch(/* istanbul ignore next */() => {
                debug.files("One or multiple couldn't be deleted - You should probably delete them manually");
                debug.files("%O", paths);
                resolve()
            })
    });

}

module.exports = {
    // fct that moves a multer file object to destination
    move_file_to_destination_folder: (file) => moveFile(
        file.path,
        path_resolve(FILES_FOLDER, file.filename), {overwrite: false}
    ),
    // for files uploaded by multer in temp folder ( here UPLOAD_FOLDER )
    delete_temp_files: /* istanbul ignore next */ (files) => delete_files(files),

    // for files stored
    delete_stored_files: /* istanbul ignore next */ (files) => delete_files(
        files.map(file => path_resolve(FILES_FOLDER, file)),
        false
    )
};