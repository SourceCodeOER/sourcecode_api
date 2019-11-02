const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const routes = require('./routes/index');

// miscellaneous passport things
const passport = require('passport');


// OpenAPI V3 validation middleware
const OpenApiValidator = require('express-openapi-validator').OpenApiValidator;
const spec = path.join(__dirname, 'api.yml');

// Initialize passport ( Passport is a singleton )
require('./config/passport');

const app = express();

// middleware
app.use(logger('dev'));
app.use(bodyParser.json());
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

// error handler
// no stacktraces leaked to user unless in development environment
app.use(function(err, req, res, next) {

    // if error thrown by validation, give everything else depending of the environment
    res.status(err.status || 500).json({
        message: err.message,
        errors: err.hasOwnProperty("errors")
            ? err.errors
            : (app.get('env') === 'development') ? [err] : []
    });

});


module.exports = app;