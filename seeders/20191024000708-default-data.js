'use strict';

module.exports = {
    up: (queryInterface, Sequelize) => {

        let table_with_schema = (TableName) =>
            (queryInterface.sequelize.options.hasOwnProperty("schema"))
                ? {schema: queryInterface.sequelize.options.schema, tableName: TableName}
                : TableName;

        return new Promise((resolve, reject) => {
            // some generator function so that I can easily update stuff
            const category_generator = kindName => ({"kind": kindName});
            const user_generator = (email, fullName, role) =>
                ({email: email, password: "jy95", fullName: fullName, role: role});
            const tag_generator = (text, isValidated, category) =>
                ({
                    text: text,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isValidated: isValidated,
                    category_id: category
                });

            Promise.all([
                // First create some Tag Categories
                queryInterface
                    .bulkInsert(table_with_schema("Tag_Categories"), [
                        category_generator("programming_language"),
                        category_generator("difficulty"),
                        category_generator("exercise_type"),
                        category_generator("plateform"),
                        category_generator("topics"),
                        category_generator("organisation")
                    ]),
                // Second create some User
                queryInterface
                    .bulkInsert(table_with_schema("Users"), [
                        user_generator("jy95@perdu.com", "Jacques Y.", "admin"),
                        user_generator("jacques95@perdu.com", "Jacques2", "user")
                    ])
            ]).then((res) => {

                    // Second create some Tags
                    return queryInterface
                        .bulkInsert(table_with_schema("Tags"), [
                            tag_generator("Java", true, 1),
                            tag_generator("C", true, 1),
                            tag_generator("easy", true, 2),
                            tag_generator("hard", true, 2),
                            tag_generator("fill_the_code", true, 3)
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
