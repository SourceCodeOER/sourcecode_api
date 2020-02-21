'use strict';

const bcrypt = require('bcryptjs');

// To encrypt password before creating / updating an instance
const SALT_WORK_FACTOR = 10;
const encryptPassword = (user, _options) => {
    // to handle both creating / update scenario here
    /* istanbul ignore else */
    if (user.changed("password")) {
        return bcrypt
            .genSalt(SALT_WORK_FACTOR)
            .then(salt => {
                return bcrypt.hash(user.password, salt);
            }).then(hash => {
                // replace the password with the hash and pass on the user object to whoever should require it.
                user.password = hash;
                return Promise.resolve(user);
            }).catch(/* istanbul ignore next */
                err => Promise.reject(err)
            );
    } else {
        return Promise.resolve(user);
    }
};

module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define('User', {
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM("admin", "user"),
            allowNull: false
        }
    }, {
        // https://sequelize.org/master/manual/models-definition.html#configuration
        timestamps: false,
    });

    // Class method User.comparePassword() to compare hash vs provided password
    User.comparePassword = function (password, hash, callback) {
        // if bcrypt.compare() succeeds it'll call our function
        // with (null, true), if password doesn't match it calls our function
        // with (null, false), if it errors out it calls our function
        // with (err, null)
        bcrypt.compare(password, hash, function (err, isMatch) {
            /* istanbul ignore next */
            if (err) {
                return callback(err, null);
            } else {
                callback(null, isMatch);
            }
        });

    };

    User.associate = function (models) {
        // a user can post multiple exercises
        User.hasMany(models.Exercise, {
            as: "exercises",
            foreignKey: {
                name: "user_id",
                allowNull: false
            }
        });
        // a user can evaluate exercise(s)
        User.hasMany(models.Notation, {
            as: "notations",
            foreignKey: {
                name: "user_id",
                allowNull: false
            },
            onDelete: "CASCADE"
        });
        // a user can possess configuration so that she/he didn't have to remember all her/his filters
        User.hasMany(models.Configuration, {
            as: "configurations",
            foreignKey: {
                name: "user_id",
                allowNull: false
            }
        });
    };

    // This hook is called when an entry is being added to the back end.
    // This method is used to hash the password before storing it in our database.
    User.addHook('beforeCreate', encryptPassword);
    User.addHook('beforeUpdate', encryptPassword);

    return User
};
