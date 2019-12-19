const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const routes = require('./routes/index');

// miscellaneous passport things
const passport = require('passport');

// own middlewares
const error_prettier = require("./middlewares/errors-beautifier");
const default_error_handler = require("./middlewares/default_error_handler");
const not_found_handler = require("./middlewares/not_found");

// location of stored files to serve as static
const {FILES_FOLDER} = require("./config/storage_paths");

// helmet for classic security measures
const helmet = require('helmet');

// OpenAPI V3 validation middleware
const OpenApiValidator = require('express-openapi-validator').OpenApiValidator;
const spec = path.join(__dirname, 'api.yml');

// Initialize passport ( Passport is a singleton )
require('./config/passport');

module.exports = new Promise((resolve, reject) => {

    const multer_storage = require("./config/storage")();

    let app = express();

    // middleware
    app.use(helmet());
    app.use(logger('dev'));
    app.use(bodyParser.json({limit: '10mb'}));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(cookieParser());

    // Gives the Swagger UI Viewer
    /* istanbul ignore next */
    app.use('/api-docs', function (_, res) {
        res.redirect("http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jy95/exercises_library/master/api.yml");
    });

    // Serves stored files with this endpoint
    /* istanbul ignore next */
    app.use("/files", express.static(FILES_FOLDER));

    // API validation before routes and password.js
    // Install the OpenApiValidator on your express app
    new OpenApiValidator({
        apiSpec: spec,
        validateRequests: true,
        validateResponses: false,
        // settings for file upload
        multerOpts: {
            storage: multer_storage
        },
        // TODO remove that when documentation is ready
        ignorePaths: /.*\/(?:auth\/(?:me|update))$/
    })
        .install(app)
        .then(() => {
            // Passport Js must have that
            app.use(passport.initialize());
            // routes
            app.use('/', routes);
            // catch 404 and forward to error handler
            app.use(not_found_handler());
            // for production, hides Sequelize messages under "general" message
            app.use(error_prettier());
            // error handler
            app.use(default_error_handler(app.get('env') === 'development'));

            resolve(app)
        })
        .catch(/* istanbul ignore next */ err => reject(err));
});