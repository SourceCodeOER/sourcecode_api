const uuidv1 = require('uuid/v1'); // uuid timestamp
const {existsSync, mkdirSync} = require("fs");
const mimeTypes = require("mime-types");
const multer = require("multer");
const {FILES_FOLDER, UPLOAD_FOLDER} = require("./storage_paths");

// to check existence of given path
const exists = (dir) => {
    try {
        return existsSync(dir);
    } catch (/* istanbul ignore next */ e) {
        /* istanbul ignore next */
        return false;
    }
};

module.exports = function () {
    // create if not exist yet this folder for multer ( temp storage )
    /* istanbul ignore next */
    if (!exists(UPLOAD_FOLDER)) {
        mkdirSync(UPLOAD_FOLDER, { recursive: true });
    }
    /* istanbul ignore next */
    // same for definitive storage
    if (!exists(FILES_FOLDER)) {
        mkdirSync(FILES_FOLDER, { recursive: true });
    }

    return multer({
        storage: multer.diskStorage({
            destination: function (req, file, cb) {
                cb(null, UPLOAD_FOLDER)
            },
            filename: function (req, file, cb) {
                // whatever the file extension, give unique uuid based on timestamp
                const extension = mimeTypes.extension(file.mimetype) /* istanbul ignore next */ || "zip";
                const generate_unique_filename = `sources-${uuidv1()}.${extension}`;
                cb(null, generate_unique_filename)
            }
        }),
        //limits: { fileSize: 200000 }
    });
}

;