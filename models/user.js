'use strict';

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    // TODO more fields ^^
    let User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
        },
        fullName: {
            type: DataTypes.STRING,
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration
        timestamps: false,
        classMethods: {
            // Class method User.comparePassword() to compare hash vs provided password
            comparePassword: function (password, hash, callback) {
                // if bcrypt.compare() succeeds it'll call our function
                // with (null, true), if password doesn't match it calls our function
                // with (null, false), if it errors out it calls our function
                // with (err, null)
                bcrypt.compare(password, hash, function (err, isMatch) {
                    if (err) {
                        return callback(err, null);
                    } else {
                        callback(null, isMatch);
                    }
                });

            }
        }
    });

    User.associate = function (models) {
        // TODO
    };

    // This hook is called when an entry is being added to the back end.
    // This method is used to hash the password before storing it in our database.
    User.addHook('beforeCreate', function(user, options) {
        const SALT_WORK_FACTOR = 10;
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if(err) {
                return Promise.reject(err);
            }
            // generate salt.
            bcrypt.hash(user.password, salt, null, function(err, hash) {
                if(err) {
                    return Promise.reject(err);
                }
                // replace the password with the hash and pass on the user object to whoever should require it.
                user.password = hash;
                return Promise.resolve(user);
            });
        });
    });

    return User

};