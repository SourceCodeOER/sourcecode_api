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

        let table_with_schema = (TableName) =>
            (queryInterface.sequelize.options.hasOwnProperty("schema"))
                ? {schema: queryInterface.sequelize.options.schema, tableName: TableName}
                : TableName;

        return new Promise((resolve, reject) => {
            Promise.all([
                // First create some Tag Categories
                queryInterface
                    .bulkInsert(table_with_schema("Tag_Categories"), [
                        {kind: "programming_language"},
                        {kind: "difficulty"},
                        {kind: "exercise_type"},
                        {kind: "plateform"},
                        {kind: "topics"},
                        {kind: "organisation"}
                    ]),
                // Second create some User
                queryInterface
                    .bulkInsert(table_with_schema("Users"), [
                        {email: "jy95@perdu.com", password: "jy95", fullName: "Jacques Y.", role: "admin"},
                        {email: "jacques95@perdu.com", password: "jy95", fullName: "Jacques2", role: "user"},
                    ])
            ]).then((res) => {


                    // Second create some Tags
                    return queryInterface
                        .bulkInsert(table_with_schema("Tags"), [
                            {isValidated: true, text: "Java", category_id: 1, createdAt: new Date(), updatedAt: new Date()},
                            {isValidated: true, text: "C", category_id: 1, createdAt: new Date(), updatedAt: new Date()},
                            {isValidated: true, text: "easy", category_id: 2, createdAt: new Date(), updatedAt: new Date()},
                            {isValidated: true, text: "hard", category_id: 2, createdAt: new Date(), updatedAt: new Date()},
                            {isValidated: true, text: "fill_the_code", category_id: 3, createdAt: new Date(), updatedAt: new Date()},
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
