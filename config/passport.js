const passport = require('passport');

const JsonStrategy = require('passport-json').Strategy;
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;

const models = require('../models');

// https://github.com/zapstar/node-sequelize-passport
// To get a JWT Token
passport.use(new JsonStrategy({
    usernameProp: "email",
    passwordProp: "password"
}, function (email, password, done) {
    models.User
        .findOne({where: {email: email}})
        .then(function (user) { // successful query to database
            if (!user) {
                return done(null, false, {message: 'Unknown user ' + email});
            }
            models.User.comparePassword(password, user.password, function (err, isMatch) {
                /* istanbul ignore next */
                if (err) {
                    return done(err);
                }
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, {message: 'Invalid password'});
                }
            });
        })
        // something went wrong with query to db
        .catch(/* istanbul ignore next */
            err => done(err)
        );
}));

passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.SECRET_PHRASE || "Super secured passphrase"
    },
    (jwtPayload, done) => {

        process.nextTick(_ => {

            const userAttributes = {
                id: jwtPayload.id
            };

            models.User
                .findOne({where: userAttributes})
                .then(function (user) { // successful query to database
                    return done(null, user);
                })
                // something went wrong with query to db
                .catch(/* istanbul ignore next */
                    error => done(error)
                );
        })
    }
));


// Si on veut avoir des sessions ( HIGHLY IMPROBABLE ) :

/*
// serialize session, only store user id in the session information
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

// from the user id, figure out who the user is...
passport.deserializeUser(function(userId, done){
    models.User
        .find({ where: { id: userId } })
        .then(function(user){
            done(null, user);
        }).catch(function(err){
        done(err, null);
    });
});
 */