const supertest = require('supertest');
const path = require("path");
let request;
const example_zip_file = path.resolve(__dirname, "file.zip");

const user = {
    email: "yolo24@uclouvain.be",
    password: "API4LIFE"
};
const userName = "Eric Cartman";

let JWT_TOKEN = ""; // The admin user
let JWT_TOKEN_2 = ""; // A simple user
const tag_categories = ["keywords", "source", "institution", "auteur"];
const tags = ["java", "UCLOUVAIN", "Jacques Y", "github.com"];


// credits to https://stackoverflow.com/a/8511350/6149867
const isObject = (obj) => typeof obj === 'object' && obj !== null;

// For the basic set up : two user ( an admin and one that is not)
async function setUpBasic() {

    const app = await require('../app.js');
    request = supertest(app);
    let result;

    // The admin user first
    result = await request
        .post("/auth/register")
        .set('Content-Type', 'application/json')
        .send(Object.assign({}, user, {fullName: userName}));
    expect(result.status).toBe(200);

    const response = await request
        .post("/auth/login")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(user);
    expect(response.status).toBe(200);

    JWT_TOKEN = response.body.token;
    expect(typeof JWT_TOKEN).toBe('string');

    // We must be able to register other user ( a simple one) for other useful cases like voting
    result = await request
        .post("/auth/register")
        .set('Content-Type', 'application/json')
        .send(Object.assign({}, user, {fullName: "Super Voter", email: "yolo_voter24@uclouvain.be"}));
    expect(result.status).toBe(200);

    let response2 = await request
        .post("/auth/login")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(Object.assign({}, user, {email: "yolo_voter24@uclouvain.be"}));
    expect(response2.status).toBe(200);

    // creates some tags categories
    const response3 = await request
        .post("/api/bulk/create_or_find_tag_categories")
        .set('Authorization', 'bearer ' + JWT_TOKEN)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(tag_categories);
    expect(response3.status).toBe(200);
    expect(response3.body).toHaveLength(tag_categories.length);

    // creates some validated tags and store them into the first categories
    const response4 = await request
        .post("/api/bulk/create_tags")
        .set('Authorization', 'bearer ' + JWT_TOKEN)
        .set('Content-Type', 'application/json')
        .send(
            tags.map(tag => ({
                text: tag,
                category_id: 1,
                isValidated: true
            }))
        );
    expect(response4.status).toBe(200);

    JWT_TOKEN_2 = response2.body.token;
    expect(typeof JWT_TOKEN_2).toBe('string');

    return "SET_UP_FINISHED"
}

// Should be able to register and login
// if not, we cannot test so much things ...
beforeAll(() => {
    // Yeah , I know it is stupid to wait but if not, Jest doesn't do its job correctly
    return expect(setUpBasic()).resolves.toBe("SET_UP_FINISHED");
});

describe("Simple case testing", () => {
    it("POST /api/bulk/create_or_find_tag_categories", async () => {
        const response = await request
            .post("/api/bulk/create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tag_categories);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(tag_categories.length);
    });

    it("POST /api/tags", async () => {
        const responses = await Promise.all(tags.map(tag => {
            request
                .post("/api/tags")
                .set('Authorization', 'bearer ' + JWT_TOKEN)
                .set('Content-Type', 'application/json')
                .send({text: tag, category_id: 1})
        }));
        expect(responses).toHaveLength(tags.length);
    });

    it("GET /api/tags", async () => {
        const response = await request
            .get("/api/tags")
            .set('Accept', 'application/json');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    it("GET /api/tags_by_categories", async () => {
        const response = await request
            .get("/api/tags_by_categories")
            .set('Accept', 'application/json');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    it("GET /api/tags_by_categories", async () => {
        const response = await request
            .get("/api/tags_categories")
            .set('Accept', 'application/json');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    it("GET /api/exercises/{id} : 404 error", async () => {
        const response = await request
            .get("/api/exercises/" + 42)
            .set('Accept', 'application/json')
            .expect(404);
        expect(response.status).toBe(404);
    });

    it("POST /api/search with no exercise", async () => {
        const criteria = {
            "data": {
                "title": "HELLO WORLD",
                "tags": [
                    1,
                    [2, -3, 4],
                    37,
                    -42
                ],
                "user_ids": [1, 2, 3],
                "exercise_ids": [1, 2, 3],
                "vote": {
                    "operator": "<=",
                    "value": 5.0
                }
            },
            "filterOptions": {
                "state": ["DRAFT", "PENDING", "VALIDATED", "NOT_VALIDATED", "ARCHIVED"],
            },
            "includeOptions": {
                "includeCreator": false,
                "includeMetrics": false,
                "includeDescription": false,
                "includeTags": false
            },
            "orderBy": [
                // When my issue in Sequelize is fixed, it will restore my tags length sorting :
                // https://github.com/sequelize/sequelize/issues/11845
                //{"field": "tags_count", "value": "DESC"},
                {"field": "id", "value": "ASC"},
                {"field": "state", "value": "DESC"},
                {"field": "avg_score", "value": "ASC"},
                {"field": "date", "value": "DESC"},
                {"field": "title", "value": "ASC"},
                {"field": "vote_count", "value": "DESC"}
            ]
        };
        await search_exercise(0, criteria);
    });

    it("POST /api/search with no parameters", async () => {
        await search_exercise(-1, {});
    });

    it("GET /api/configurations", async () => {
        let response = await request
            .get("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send();
        expect(response.status).toBe(200);
    });

    it("GET /api/configurations with settings", async () => {
        let response = await request
            .get("/api/configurations")
            .query('ids=1')
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send();
        expect(response.status).toBe(200);
    });

    it("PUT /api/configurations without a valid configuration", async () => {
        await request
            .put("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send({
                title: "YOLO",
                tags: [1, 2, 3],
                name: "YOLO",
                id: 42
            })
            .expect(404);
    });

    it("GET /api/tags with all settings used", async () => {
        const response = await request
            .get("/api/tags")
            .query('state=pending')
            .query('tags_ids=1')
            .query('tags_ids=2')
            .query('categories_ids=' + 1)
            .query('title=hero')
            .set('Accept', 'application/json');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it("GET /api/tags_by_categories with all settings used", async () => {
        const response = await request
            .get("/api/tags_by_categories")
            .query('state=pending')
            .query('onlySelected=1')
            .set('Accept', 'application/json');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it("GET /auth/me", async () => {
        const response = await request
            .get("/auth/me")
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN);

        expect(response.status).toBe(200);
        expect(isObject(response.body)).toBeTruthy();
        expect(response.body.hasOwnProperty("email")).toBeTruthy();
        expect(response.body.hasOwnProperty("fullName")).toBeTruthy();
        expect(response.body.hasOwnProperty("role")).toBeTruthy();
        expect(response.body.hasOwnProperty("password")).toBeFalsy();
        expect(response.body.fullName).toBe(userName);
        expect(response.body.email).toBe(user.email);
        expect(response.body.role).toBe("admin");
    });

    it("PUT /auth/update", async () => {
        let response = await request
            .put("/auth/update")
            .set('Content-Type', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .send(
                Object.assign({}, user, {"fullName": userName})
            );
        expect(response.status).toBe(200);
    });

    it("GET /api/users", async () => {
        const response = await request
            .get("/api/users")
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN);

        expect(response.status).toBe(200);
        expect(response.body.hasOwnProperty("metadata")).toBeTruthy();
        expect(response.body.hasOwnProperty("data")).toBeTruthy();
        expect(response.body.data).toHaveLength(response.body.metadata.totalItems);
    });

    it("GET /api/users with all settings", async () => {
        const response = await request
            .get("/api/users")
            .query('metadata%5Bsize%5D=10')
            .query('metadata%5Bpage%5D=1')
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN);

        expect(response.status).toBe(200);
        expect(response.body.hasOwnProperty("metadata")).toBeTruthy();
        expect(response.body.hasOwnProperty("data")).toBeTruthy();
        expect(response.body.data).toHaveLength(response.body.metadata.totalItems);
    });

    it("GET /api/tags_categories", async () => {
        let response = await request
            .get("/api/tags_categories");
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    it("GET /api/tags_categories with count properties", async () => {
        let response = await request
            .get("/api/tags_categories")
            .query("fetchStats=1");
        expect(response.status).toBe(200);
        // check that the count is correct ( for example if someone creates a better version that mine with errors ^^)
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.every(t => t.hasOwnProperty("total"))).toBeTruthy();
        expect(response.body.every(t => t.hasOwnProperty("total_validated"))).toBeTruthy();
        expect(response.body.every(t => t.hasOwnProperty("total_unvalidated"))).toBeTruthy();
        expect(response.body.every(t => t.hasOwnProperty("total_deprecated"))).toBeTruthy();
        expect(response.body.every(t => t.total === (t.total_validated + t.total_unvalidated + t.total_deprecated))).toBeTruthy();
    });

    it("POST /api/bulk/create_tags", async () => {
        // creates some tags categories
        let response = await request
            .post("/api/bulk/create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tag_categories);
        expect(response.status).toBe(200);

        const aTagCategory = response.body[0].id;
        const someTags = [
            {
                text: "MASTER_TAG_1",
                category_id: aTagCategory,
                isValidated: true,
            },
            {
                text: "MASTER_TAG_2",
                category_id: aTagCategory,
            }
        ];

        // insert two tags by admin
        let response2 = await request
            .post("/api/bulk/create_tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(someTags);
        expect(response2.status).toBe(200);

        // Retrieve the tags and check it works as expected
        response2 = await request
            .get("/api/tags")
            .query('title=MASTER_TAG_')
            .set('Accept', 'application/json');
        expect(response2.status).toBe(200);
        expect(Array.isArray(response2.body)).toBeTruthy();
        expect(response2.body).toHaveLength(2);

        // check if given properties are satisfied
        expect(someTags
            .every(tag =>
                response2.body
                    .some(tag2 =>
                        (tag.text === tag2.tag_text)
                        && (tag2.category_id === aTagCategory)
                        && (tag2.isValidated === (tag.isValidated || false))
                    )
            )
        );
    });

    it("Export all exercises without settings", async () => {
        // Try to use at least one combination of everything possible
        const response = await request
            .post("/api/export")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .send();
        expect(response.status).toBe(200);
        expect(response.body.hasOwnProperty("categories"));
        expect(response.body.hasOwnProperty("exercises"));
    });
});

describe("Complex scenarios", () => {
    it("Scenario n°1 : Creates a exercise / Find it / Update it 2 times and then update its status several times", async () => {
        // retrieve some tag categories
        let response = await request
            .post("/api/bulk/create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tag_categories);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(tag_categories.length);

        const tag_categories_ids = response.body.map(category => category.id);
        // create some tags
        response = await request
            .post("/api/bulk/create_tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tags.map(tag => ({
                text: tag,
                category_id: tag_categories_ids[0]
            })));
        expect(response.status).toBe(200);

        // take some tags
        response = await request
            .get("/api/tags")
            .set('Accept', 'application/json');
        expect(response.status).toBe(200);
        const some_tags_ids = response.body
            .map(tag => tag.tag_id);

        // creates one exercise
        const title = "HELLO WORLD";
        const some_exercise_data = {
            "title": title,
            "description": "Some verrrrrrrrrry long description here",
            // try to use both existent tags and not
            tags: some_tags_ids.concat(
                ["SOME_TAG1", "SOME_TAG2", "SOME_TAG3", "some_Tag3"].map(tag => ({
                    text: tag,
                    category_id: tag_categories_ids[0]
                }))
            ),
            "state": "DRAFT"
        };
        let responseTemp = await request
            .post("/api/bulk/create_exercises")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send([
                some_exercise_data
            ]);
        expect(responseTemp.status).toBe(200);

        // research this exercise
        const criteria = {
            data: {
                title: title,
                tags: some_tags_ids
            }
        };
        response = await search_exercise(1, criteria);

        let data = response.data[0];
        expect(data.version).toBe(0);
        expect(data.state).toBe("DRAFT");

        // A simple user should not be able to delete exercises
        await request
            .delete("/api/bulk/delete_exercises")
            .set('Accept', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN_2)
            .send([
                data.id
            ])
            .expect(403);

        // A simple user should not be able to modify a exercise that doesn't belong to him
        let newExerciseVersion = {
            title: data.title,
            version: data.version,
            description: data.description + "API4FUN",
            tags: data.tags.map(tag => tag.tag_id),
            removePreviousFile: true,
            state: "PENDING",
        };

        response = await request
            .put("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN_2)
            .set('Content-Type', 'application/json')
            .send(newExerciseVersion);

        expect(response.status).toBe(403);


        // test most updates cases : keep tags / add & remove
        // 1. Only changed description
        response = await request
            .put("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send(newExerciseVersion);

        expect(response.status).toBe(200);

        response = await request
            .get("/api/exercises/" + data.id)
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);

        expect(isObject(response.body)).toBeTruthy();
        expect(response.body.version).toBe(1);
        expect(response.body.id).toBe(data.id);
        expect(response.body.state).toBe("PENDING");

        // 2. Add / remove some tags ( difficult case )
        response = await request
            .put("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                title: data.title,
                version: 1,
                description: data.description + "API4FUN",
                tags: data.tags.splice(0, 3).map(tag => tag.tag_id).concat([
                    {text: "TRY 1", category_id: tag_categories_ids[0]},
                    {text: "TRY 2", category_id: tag_categories_ids[0]},
                ])
            });

        expect(response.status).toBe(200);

        // 3. Finally validate the exercise
        response = await request
            .put("/api/bulk/modify_exercises_status")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                exercises: [data.id],
                state: "VALIDATED"
            });

        expect(response.status).toBe(200);

        // 4. Archive this exercise
        response = await request
            .put("/api/bulk/modify_exercises_status")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                exercises: [data.id],
                state: "ARCHIVED"
            });

        expect(response.status).toBe(200);

        // Other user should not be able to fetch that
        response = await request
            .get("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN_2)
            .set('Accept', 'application/json');
        expect(response.status).toBe(410);

        // but its creator / admin should
        response = await request
            .get("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json');
        expect(response.status).toBe(200);

    });

    it("Scenario n°2 : Creates a single exercise with (no) existent tag(s) and add tags later", async () => {
        // retrieve some tag categories
        let response = await request
            .post("/api/bulk/create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tag_categories);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(tag_categories.length);

        // create some tags
        response = await Promise.all(tags.map(tag => {
            request
                .post("/api/tags")
                .set('Authorization', 'bearer ' + JWT_TOKEN)
                .set('Content-Type', 'application/json')
                .send({text: tag, category_id: 1})
        }));
        expect(response).toHaveLength(tags.length);

        const title = "MEAN_OF_LIFE_42";
        // creates a single exercise
        const exerciseData = {
            "title": title,
            "description": "Random exercise",
            "tags": [1, 2, 3, {
                "text": "JDG",
                "category_id": 1
            }, {
                "text": tags[2],
                "category_id": 1
            }],
            "url": "https://inginious.info.ucl.ac.be/mycourses"
        };

        response = await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send(exerciseData);

        expect(response.status).toBe(200);

        const criteria = {
            data: {
                title: title
            },
            metadata: {
                size: 1
            }
        };
        response = await search_exercise(1, criteria);
        const data = response.data[0];
        expect(data.version).toBe(0);
        expect(data.file).toBe(null);
        expect(data.url).not.toBe(null);

        // Only additions of tags
        response = await request
            .put("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                title: data.title,
                version: data.version,
                description: data.description,
                tags: data.tags.map(tag => tag.tag_id).concat([
                    {text: "TRY 42-42", category_id: 1}
                ]),
                "url": null,
                "file": null
            });

        expect(response.status).toBe(200);

    });

    it("Scenario n°3 : Creates a tag proposal / update it and try to recreate one similar", async () => {
        // creates a tag proposal
        let responseTmp = await request
            .post("/api/tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({text: "UNVALIDATED_TAG", category_id: 1});
        expect(responseTmp.status).toBe(200);

        // should be able to retrieve it
        const response = await request
            .get("/api/tags")
            .set('Accept', 'application/json');
        expect(response.status).toBe(200);
        const created_tag = response
            .body
            .filter(tag => tag.tag_text === "UNVALIDATED_TAG" && tag.category_id === 1)
            .reduce((_prev, curr) => curr, undefined);

        expect(created_tag).not.toBe(undefined);
        expect(created_tag.version).toBe(0);
        expect(created_tag.isValidated).toBe(false);

        // modify it to validate it
        responseTmp = await request
            .put("/api/tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                tag_id: created_tag.tag_id,
                tag_text: created_tag.tag_text,
                category_id: created_tag.category_id,
                version: created_tag.version,
                isValidated: true
            });
        expect(responseTmp.status).toBe(200);

        // try to recreate it (for example if someone doesn't see the tag proposal)
        responseTmp = await request
            .post("/api/tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({text: "UNVALIDATED_TAG", category_id: 1});
        expect(responseTmp.status).toBe(200);
    });

    it("Scenario n°4 : Evaluates an exercise : multiple variation", async () => {
        const title = "SOME_EXERCISE_WITH_VOTES";
        // creates a single exercise
        let responseTmp = await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                "title": title,
                "description": "Random exercise",
                "tags": [1, 2, 3]
                    .concat(
                        ["JDG", "JDG-2", "JDG-3"]
                            .map(text => ({
                                "text": text,
                                "category_id": 1
                            }))
                    )
            });
        expect(responseTmp.status).toBe(200);

        const criteria = {
            data: {
                title: title
            },
            metadata: {
                size: 1
            }
        };

        // retrieve it and send first vote on it
        let response = await search_exercise(1, criteria);
        let data = response.data[0];

        // we must check that metrics are correct
        expect(data).toHaveProperty("metrics");
        expect(isObject(data.metrics)).toBeTruthy();
        expect(data.metrics).toHaveProperty("votes");
        expect(data.metrics).toHaveProperty("avg_score");
        expect(data.metrics.votes).toBe(0);
        expect(data.metrics.avg_score).toBe(0);

        // User 1 votes for this exercise
        responseTmp = await request
            .post("/api/vote_for_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                exercise_id: data.id,
                score: 3
            });
        expect(responseTmp.status).toBe(200);

        // We should see the change in this exercise data
        response = await search_exercise(1, criteria);
        expect(response.data[0].metrics.votes).toBe(1);
        expect(response.data[0].metrics.avg_score).toBe(3);

        // User 2 votes for this exercise
        response = await request
            .post("/api/vote_for_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN_2)
            .set('Content-Type', 'application/json')
            .send({
                exercise_id: data.id,
                score: 2
            });
        expect(response.status).toBe(200);

        // We should see the change in this exercise data
        response = await search_exercise(1, criteria);
        expect(response.data[0].metrics.votes).toBe(2);
        expect(response.data[0].metrics.avg_score).toBe(2.5);

        // User 1 wants to change his vote for this exercise
        responseTmp = await request
            .post("/api/vote_for_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                exercise_id: data.id,
                score: 5.0
            });
        expect(responseTmp.status).toBe(200);

        // We should see the change in this exercise data
        response = await search_exercise(1, criteria);
        expect(response.data[0].metrics.votes).toBe(2);
        expect(response.data[0].metrics.avg_score).toBe(3.5);

        const check = await request
            .get("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .query('includeOptions%5BincludeCreator%5D=true')
            .query('includeOptions%5BincludeMetrics%5D=false')
            .query('includeOptions%5BincludeDescription%5D=false')
            .query('includeOptions%5BincludeTags%5D=false')
            .send();

        expect(check.status).toBe(200);
        expect(check.body.hasOwnProperty("metrics")).toBeFalsy();
        expect(check.body.hasOwnProperty("description")).toBeFalsy();
        expect(check.body.hasOwnProperty("tags")).toBeFalsy();
        expect(check.body.hasOwnProperty("creator")).toBeTruthy();
        expect(check.body.hasOwnProperty("vote")).toBeTruthy();
        expect(check.body.vote).toBe(5.0);
    });

    it("Scenario n°5 : Creates a configuration / update it then delete it", async () => {
        // creates some tags ( it is not important if validated or not )
        const responses = await Promise.all(tags.map(tag => {
            request
                .post("/api/tags")
                .set('Authorization', 'bearer ' + JWT_TOKEN)
                .set('Content-Type', 'application/json')
                .send({text: tag, category_id: 1})
                .expect(200)
        }));
        expect(responses).toHaveLength(tags.length);
        let responseTmp;
        // creates a configuration
        responseTmp = await request
            .post("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                name: "UCLouvain exercises in Java",
                title: "CS1-Java",
                tags: [1]
            });
        expect(responseTmp.status).toBe(200);

        // should be able to find it in my configurations list
        const response = await request
            .get("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send();

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].tags).toHaveLength(1);
        expect(response.body[0].name).toBe("UCLouvain exercises in Java");
        expect(response.body[0].title).toBe("CS1-Java");

        // should be able to to update it
        responseTmp = await request
            .put("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                name: "UCLouvain 4 FUN",
                title: "CS1-Java",
                tags: [2],
                id: response.body[0].id
            });
        expect(responseTmp.status).toBe(200);

        // changes should be visible
        const response2 = await request
            .get("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send();

        expect(response2.status).toBe(200);
        expect(response2.body[0].tags).not.toBe(response.body[0].tags);
        expect(response2.body[0].name).not.toBe(response.body[0].name);
        expect(response2.body[0].id).toBe(response.body[0].id);
        expect(response2.body[0].title).toBe(response.body[0].title);

        // should be able to delete it
        responseTmp = await request
            .delete("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                id: response2.body[0].id
            });
        expect(responseTmp.status).toBe(200);
    });

    it("Scenario n°6 : Change a Tag Category", async () => {

        // Retrieve created tag category
        const response = await request
            .get("/api/tags_categories")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send();
        expect(response.status).toBe(200);

        // Takes the first one
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(1);

        let responseTmp = await request
            .put("/api/tags_categories")
            .set('Content-Type', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .send({
                id: response.body[0].id,
                category: response.body[0].category
            });
        expect(responseTmp.status).toBe(200);
    });

    it("Scenario n°7 : Creates a single exercise with two tags and deletes one tag", async () => {

        // creates a tag category just for that purpose
        const response = await request
            .post("/api/bulk/create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(["TEMP_category"]);
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        const categoryId = response.body[0].id;

        // creates an exercise with two tags
        const some_exercise_data = {
            "title": "Exercise for delete scenario",
            tags: ["TEMP_TAG-0", "TEMP_TAG-1", "TEMP_TAG-2"]
                .map(tag => ({
                    text: tag,
                    category_id: categoryId
                }))
        };
        let responseTmp = await request
            .post("/api/bulk/create_exercises")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send([
                some_exercise_data
            ]);
        expect(responseTmp.status).toBe(200);

        // fetch the tags linked to this exercise
        let searchCriteria = {
            includeOptions: {
                includeTags: true,
                includeMetrics: true
            },
            filterOptions: {
                "tags": "pending"
            },
            data: {
                title: "Exercise for delete scenario"
            }
        };
        let result = await search_exercise(1, searchCriteria);
        const tags = result.data[0].tags.map(tag => tag.tag_id);

        // delete multiple tags but keep one ( the first one )
        let test = await request
            .delete("/api/bulk/delete_tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send(tags.slice(1));
        expect(test.status).toBe(200);

        // check that there is only a single tag now
        result = await search_exercise(1, searchCriteria);
        expect(result.data[0].tags).toHaveLength(1);

        // delete the temp tags category to provoke the destruction of the last tags
        responseTmp = await request
            .delete("/api/bulk/delete_tags_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send([
                categoryId
            ]);
        expect(responseTmp.status).toBe(200);

        // check that there is no tag left
        result = await search_exercise(1, searchCriteria);
        expect(result.data[0].tags).toHaveLength(0);
    });

    it("Scenario n°8 : Export all exercises with all settings", async () => {
        // Try to use at least one combination of everything possible
        const response = await request
            .post("/api/export")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .send({
                filterOptions: {
                    state: ["VALIDATED", "ARCHIVED"],
                    tags: "pending"
                },
                "orderBy": [
                    // When my issue in Sequelize is fixed, it will restore my tags length sorting :
                    // https://github.com/sequelize/sequelize/issues/11845
                    //{"field": "tags_count", "value": "DESC"},
                    {"field": "id", "value": "ASC"},
                    {"field": "state", "value": "DESC"},
                    {"field": "avg_score", "value": "ASC"},
                    {"field": "date", "value": "DESC"},
                    {"field": "title", "value": "ASC"},
                    {"field": "vote_count", "value": "DESC"}
                ]
            });
        expect(response.status).toBe(200);
        expect(response.body.hasOwnProperty("categories"));
        expect(response.body.hasOwnProperty("exercises"));
    });
});

describe("Using multipart/form-data (instead of JSON)", () => {
    it("Should be able to create an exercise with a file and update it (new file and new url)", async () => {
        const title = "MULTIPART FORM TESTING 1";
        const exercise_data = {
            "title": title,
            "description": "HELLO WORLD",
            "url": "https://inginious.info.ucl.ac.be/"
        };

        const search_criteria = {
            data: {
                title: title
            },
            metadata: {
                size: 1
            }
        };

        let responseTmp = await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            //.set('Content-Type', "multipart/form-data")
            .attach("exerciseFile", example_zip_file)
            .field(exercise_data)
            .field("tags[0][text]", "MULTI PART exercise")
            .field("tags[0][category_id]", 1)
            .field("tags[1][text]", "MULTI PART exercise 2")
            .field("tags[1][category_id]", 1)
            .field("tags[2][text]", "MULTI PART exercise 3")
            .field("tags[2][category_id]", 1)
            .field("tags[3]", 1)
            .field("tags[4]", 2)
            .field("tags[5]", 3);
        expect(responseTmp.status).toBe(200);

        const exercise = await search_exercise(1, search_criteria);
        expect(exercise.data[0].file).not.toBe(null);
        expect(exercise.data[0].url).not.toBe(null);

        responseTmp = await request
            .put("/api/exercises/" + exercise.data[0].id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .attach("exerciseFile", example_zip_file)
            .field({
                "title": title,
                "description": "Something changes ...",
                "version": 0
            })
            .field("tags[0][text]", "MULTI PART exercise")
            .field("tags[0][category_id]", 1)
            .field("tags[1][text]", "MULTI PART exercise 2")
            .field("tags[1][category_id]", 1)
            .field("tags[2][text]", "MULTI PART exercise 3")
            .field("tags[2][category_id]", 1)
            .field("tags[3]", 1)
            .field("tags[4]", 2)
            .field("tags[5]", 3);
        expect(responseTmp.status).toBe(200);

        const exercise2 = await search_exercise(1, search_criteria);
        expect(exercise2.data[0].file).not.toBe(exercise.data[0].file);
        expect(exercise2.data[0].url).toBe(exercise2.data[0].url);
        expect(exercise2.data[0].title).toBe(title);
        expect(exercise2.data[0].description).toBe("Something changes ...");
        expect(exercise2.data[0].tags).toHaveLength(exercise.data[0].tags.length);

    });
    it("Should be able to upload multiple exercises with their linked files then delete one of them", async () => {

        // retrieve some tag categories
        let response = await request
            .post("/api/bulk/create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tag_categories);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(tag_categories.length);

        // files linked to exercises
        const files = ["file.zip", "file2.zip"].map((filename, index) => ({
            "filename": filename,
            "path": path.resolve(__dirname, "./" + filename),
            "exercise": index
        }));

        // an array of exercises
        const exercises = [...Array(3).keys()].map((number) => ({
            "description": "HELLO WORLD",
            "url": "https://inginious.info.ucl.ac.be/",
            "title": "SOME MULTIPLE UPLOAD WITH FILE " + (number + 1),
            "tags": ["java", "Java", "JaVA"].map(tag => ({
                "category_id": response.body[0].id,
                "text": tag
            }))
        }));

        let result = await multiple_upload_with_files_request(exercises, files);
        expect(result.status).toBe(200);

        const criteria = {
            data: {
                title: "SOME MULTIPLE UPLOAD WITH FILE"
            }
        };

        result = await search_exercise(3, criteria);

        // Take the first one to be deleted
        let responseTmp = await request
            .delete("/api/bulk/delete_exercises")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send([
                result.data[0].id
            ]);
        expect(responseTmp.status).toBe(200);

        // Only one should be removed after that
        await search_exercise(2, criteria);

    });
    it("A guest should not be allowed to create an exercise with(out) a file", async () => {
        const title = "MULTIPART FORM TESTING 1";
        const exercise_data = {
            "title": title,
            "description": "HELLO WORLD",
            "url": "https://inginious.info.ucl.ac.be/"
        };

        const test = await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + "NOT_A_TOKEN")
            //.set('Content-Type', "multipart/form-data")
            .attach("exerciseFile", example_zip_file)
            .field(exercise_data)
            .field("tags[0]", 42)
            .field("tags[1]", 43)
            .field("tags[2]", 44);
        expect(test.status).toBe(401);
    });
});

describe("Validations testing", () => {

    it("POST /login : Wrong content type", async () => {
        await request
            .post("/auth/login")
            .set('Content-Type', 'application/xml')
            .send()
            .expect(400);
    });

    it("POST /login : Bad request", async () => {
        await request
            .post("/auth/login")
            .set('Content-Type', 'application/json')
            .send()
            .expect(400);
    });

    it("POST /login : Wrong password", async () => {
        await request
            .post("/auth/login")
            .set('Content-Type', 'application/json')
            .send(
                Object.assign({}, user, {password: "HACKERMAN"})
            )
            .expect(401);
    });

    it("POST /login : Unknown user", async () => {
        await request
            .post("/auth/login")
            .set('Content-Type', 'application/json')
            .send(
                Object.assign({}, user, {email: "hackerman@perdu.com"})
            )
            .expect(401);
    });

    it("POST /register : Cannot register same user twice (or more)", async () => {
        await request
            .post("/auth/register")
            .set('Content-Type', 'application/json')
            .send(Object.assign({}, user, {fullName: userName}))
            .expect(409);
    });

    it("PUT /api/tags : A simple user cannot modify a tag", async () => {
        await request
            .put("/api/tags")
            .set('Content-Type', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN_2)
            .send({
                "tag_id": 0,
                "tag_text": "SomeTest",
                "category_id": 0,
                "isValidated": false,
                "version": 0
            })
            .expect(403);
    });

    it("PUT /api/tags_categories : A simple user cannot modify a tag category", async () => {
        await request
            .put("/api/tags_categories")
            .set('Content-Type', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN_2)
            .send({
                id: 42,
                category: "HACKERMAN"
            })
            .expect(403);
    });

    it("PUT /api/exercises/{id} : Required an account", async () => {
        await request
            .put("/api/exercises/42")
            .set('Content-Type', 'application/json')
            .send({
                "title": "A Super Exercise",
                "description": "...",
                "tags": [
                    0, 1, 2
                ],
                "url": "https://inginious.info.ucl.ac.be/course/LEPL1402/Streams",
                "version": 42
            })
            .expect(401);
    });

    it("PUT /auth/update : An simple user cannot become an admin", async () => {
        await request
            .put("/auth/update")
            .set('Content-Type', 'application/json')
            .set('Authorization', 'bearer ' + JWT_TOKEN_2)
            .send({
                "email": "jy95@perdu.com",
                "fullName": "HACKERMAN",
                "password": "42",
                "role": "admin",
            })
            .expect(403);
    });

    it("POST /api/create_exercise : An simple user cannot insert a exercise with forbidden state", async () => {
        // creates one exercise
        const some_exercise_data = {
            "title": "HELLO WORLD",
            "description": "Some verrrrrrrrrry long description here",
            tags: ["SOME_TAG1", "SOME_TAG2", "SOME_TAG3"].map(text => ({
                text: text,
                category_id: 42
            })),
            "state": "VALIDATED"
        };
        let responseTemp = await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN_2)
            .set('Content-Type', 'application/json')
            .send(some_exercise_data);
        expect(responseTemp.status).toBe(403);
    });

    it("POST /api/ : Cannot create/update an exercise with not expected validated tag count", async () => {
        // creates one exercise with 2
        const title = "HELLO WORLD";
        const some_exercise_data = {
            "title": title,
            "description": "Some verrrrrrrrrry long description here",
            tags: [1, 2, {"text": "lol", "category_id": 1}]
        };
        let responseTemp = await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send(some_exercise_data);
        expect(responseTemp.status).toBe(400);
    })
});

// utilities functions
// to fetch exercise(s)
// if expected_count is equal to -1, we should skip a test
async function search_exercise(expected_count, search_criteria) {
    const response = await request
        .post("/api/search")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(search_criteria);

    expect(response.status).toBe(200);

    expect(isObject(response.body)).toBeTruthy();
    expect(Array.isArray(response.body.data)).toBeTruthy();
    if (expected_count !== -1) {
        expect(response.body.metadata.totalItems).toBe(expected_count);
    }
    expect(response.body.data).toHaveLength(response.body.metadata.totalItems);
    return response.body;
}

// to prepare a supertest instance with
function multiple_upload_with_files_request(exercises, files) {

    // build the request now
    let requestInstance = request
        .post("/api/bulk/create_exercises")
        .set('Authorization', 'bearer ' + JWT_TOKEN);

    // Add all given files
    for (const file of files) {
        requestInstance.attach("files", file.path)
    }

    // Add the mapping between exercises and files
    files.forEach((file, index) => {
        const sub_field = "filesMapping[" + index + "]";
        requestInstance.field(sub_field + "[filename]", file.filename);
        requestInstance.field(sub_field + "[exercise]", file.exercise);
    });

    // Add the exercises metadata
    exercises.forEach((exercise, index) => {

        // since tags are more complicated to deal with, I must handle them separately
        const exercise_tags = exercise.tags;
        delete exercise.tags;

        const sub_field = "exercisesData[" + index + "]";

        // for other properties of exercise, it is pretty easy to handle them
        Object.entries(exercise).forEach(([key, value]) => {
            requestInstance.field(sub_field + "[" + key + "]", value);
        });

        // for tags, we have to use this ugly way because of supertest
        const sub_tag_field = sub_field + "[tags]";

        exercise_tags.forEach((tag, index) => {
            const sub_tag_field_index = sub_tag_field + "[" + index + "]";
            Object.entries(tag).forEach(([key, value]) => {
                requestInstance.field(sub_tag_field_index + "[" + key + "]", value);
            });
        });
    });

    return requestInstance;
}
