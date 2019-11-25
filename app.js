const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const routes = require('./routes/index');

// miscellaneous passport things
const passport = require('passport');

// Sequelize for error handeling
const Sequelize = require("sequelize");

// helmet for classic security measures
const helmet = require('helmet');

// OpenAPI V3 validation middleware
const OpenApiValidator = require('express-openapi-validator').OpenApiValidator;
const spec = path.join(__dirname, 'api.yml');

// Initialize passport ( Passport is a singleton )
require('./config/passport');

const app = express();

// middleware
app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.json({limit: '10mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Gives the Swagger UI Viewer
app.use('/api-docs', function (_, res) {
    res.redirect("http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jy95/exercises_library/master/api.yml");
});

// API validation before routes and password.js
// Install the OpenApiValidator on your express app
new OpenApiValidator({
    apiSpec: spec,
    validateRequests: true,
    validateResponses: false,
    // securityHandlers: {
    //   ApiKeyAuth: (req, scopes, schema) => true,
    // },
}).install(app);

// Passport Js must have that
app.use(passport.initialize());

// routes
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// for production, hides Sequelize messages under "general" message
app.use(function (err, req, res, next) {

    // looks nice ; found on some angular code
    let custom_err = new Error();
    // to check it is not an expected error of these
    let is_custom = true;
    switch (true) {
        case err instanceof Sequelize.EmptyResultError:
            // resource not found
            custom_err.message = "Resource not found";
            custom_err.status = 404;
            break;
        case err instanceof Sequelize.DatabaseError:
            // constraints violations
            custom_err.message = "Problem with the database : Constraints not satisfied , etc";
            custom_err.status = 400;
            break;
        case err instanceof Sequelize.ConnectionError:
            // Connection issues : cannot reach , timeout, etc
            custom_err.message = "The database cannot be reached : Please try later";
            custom_err.status = 503;
            break;
        case err instanceof Sequelize.OptimisticLockError:
            // catch locking issues with version
            custom_err.message = "It seems you are using an outdated version of this resource : Operation denied";
            custom_err.status = 409;
            break;
        case err instanceof  Sequelize.BaseError:
            // catch all unwatched exceptions coming from Sequelize
            custom_err.message = "Unexpected error";
            break;
        default:
            is_custom = false;
            custom_err = err;
    }
    if (is_custom) {
        custom_err.is_custom = true;
        custom_err.dev_errors = [err];
    }
    next(custom_err)

});

// error handler
// no stacktraces leaked to user unless in development environment
app.use(function(err, req, res, next) {

    // if error thrown by validation, give everything else depending of the environment
    res.status(err.status || 500).json({
        message: err.message,
        errors: err.hasOwnProperty("errors")
            ? err.errors
            : (app.get('env') === 'development' && err.hasOwnProperty("is_custom") ) ? err.dev_errors : [err]
    });

});


module.exports = app;