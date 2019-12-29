const filesManager = require("../controllers/_common/files_manager");

// Just to be sure that files in temp folder are deleted in any case
module.exports = () => (err, req, res, next) => {
    if (req.files) {
        const files = Object
            .values(req.files)
            .reduce((acc, val) => {
                /* istanbul ignore next */
                const filesArr = (Array.isArray(val)) ? val : [val];
                acc.push(...filesArr);
                return acc;
            }, []);
        filesManager
            .delete_temp_files(files)
            .then(() => next(err));
    } else {
        next(err);
    }
};