'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.bulkInsert('People', [{
            name: 'John Doe',
            isBetaMember: false
          }], {});
        */
        return new Promise((resolve, reject) => {
            Promise.all([
                // First create some Tag Categories
                queryInterface
                    .bulkInsert("Tag_Category", [
                        {kind: "programming_language"},
                        {kind: "difficulty"},
                        {kind: "exercise_type"},
                        {kind: "plateform"},
                        {kind: "topics"},
                        {kind: "organisation"}
                    ]),
                // Second create some User
                queryInterface
                    .bulkInsert("User", [
                        {username: "jy95", password: "jy95", fullName: "Jacques Y.", role: "admin"},
                        {username: "jacques95", password: "jy95", fullName: "Jacques2", role: "user"},
                    ])
            ]).then((res) => {
                    const users = res[0];
                    const tags = res[1];
                    console.log(tags);

                    // Second create some Tags
                    return queryInterface
                        .bulkInsert("Tag", [
                            {isValidated: true, text: "Java", category_id: 1},
                            {isValidated: true, text: "C", category_id: 1},
                            {isValidated: true, text: "easy", category_id: 2},
                            {isValidated: true, text: "hard", category_id: 2},
                            {isValidated: true, text: "fill_the_code", category_id: 3},
                        ])
                }
            ).catch((error) => {
                console.log(error);
                reject(error);
            })
        });

    },

    down: (queryInterface, Sequelize) => {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.bulkDelete('People', null, {});
        */
    }
};
