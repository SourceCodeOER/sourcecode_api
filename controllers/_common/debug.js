const Debug = require('debug');

module.exports = {
    "errors": Debug("sourcecode_api:error_handler"),
    "tracker": Debug("sourcecode_api:error_tracker"),
    "files": Debug("sourcecode_api:files"),
};