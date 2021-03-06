const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// miscellaneous passport things
const passport = require('passport');

// own middlewares
const error_prettier = require("./middlewares/errors-beautifier");
const default_error_handler = require("./middlewares/default_error_handler");
const not_found_handler = require("./middlewares/not_found");
const securityCheck = require("./middlewares/security");
const removeTempFiles = require("./middlewares/remove_temp_files");

// location of stored files to serve as static
const {FILES_FOLDER} = require("./config/storage_paths");

// helmet for classic security measures
const helmet = require('helmet');

// OpenAPI V3 validation middleware
const Enforcer = require("openapi-enforcer-middleware");
const enforcerMulter = require('openapi-enforcer-multer');
const spec = path.join(__dirname, 'api.yml');
const controllerDirectory = path.resolve(__dirname, 'controllers');

// Initialize passport ( Passport is a singleton )
require('./config/passport');

module.exports = new Promise((resolve, reject) => {

    // storage for multer
    const storage = require("./config/storage")();

    let app = express();

    // common middleware
    app.use(helmet());
    app.use(logger('dev'));
    app.use(bodyParser.json({limit: '10mb'}));
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(cookieParser());

    // Gives the Swagger UI Viewer
    /* istanbul ignore next */
    app.use('/api-docs', function (_, res) {
        res.redirect("http://petstore.swagger.io/?url=https://raw.githubusercontent.com/SourceCodeOER/sourcecode_api/master/api.yml");
    });

    // Serves stored files with this endpoint
    /* istanbul ignore next */
    app.use("/files", express.static(FILES_FOLDER));

    // main API setup
    try {
        // initialize the enforcer
        const enforcer = Enforcer(spec, {
            componentOptions: {
                requestBodyAllowedMethods: {"delete": true},
                exceptionSkipCodes: ["WSCH001", "WMED001"]
            },
            resValidate: false
        });
        // check if the client is allowed on this endpoint
        enforcer.use(securityCheck());
        enforcer
            .controllers(controllerDirectory)
            .then(() => {
                // Passport Js must have that
                app.use(passport.initialize());

                // add enforcer multer middleware
                app.use(enforcerMulter(enforcer, storage));

                // add the enforcer middleware runner to the express app
                app.use(enforcer.middleware());

                // remove temp files if an error occurs (if provided)
                app.use(removeTempFiles());
                // catch 404 and forward to error handler
                app.use(not_found_handler());
                // for production, hides Sequelize messages under "general" message
                app.use(error_prettier());
                // error handler
                app.use(default_error_handler(app.get('env') === 'development'));

                resolve(app);
            })
            .catch(/* istanbul ignore next */err => {
                throw err;
            });
    } catch (err) {
        /* istanbul ignore next */
        reject(err);
    }
});
