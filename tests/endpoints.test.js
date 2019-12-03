const app = require('../app.js');
const supertest = require('supertest');
const path = require("path");
const request = supertest(app);
const example_zip_file = path.resolve(__dirname, "file.zip");

const user = {
    email: "yolo24@uclouvain.be",
    password: "API4LIFE"
};
const userName = "Eric Cartman";

let JWT_TOKEN = "";
const tag_categories = ["source", "institution", "auteur"];
const tags = ["java", "UCLOUVAIN", "Jacques Y", "github.com"];

// credits to Mozilla
// https://stackoverflow.com/a/1527820/6149867
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// credits to https://stackoverflow.com/a/8511350/6149867
const isObject = (obj) => typeof obj === 'object' && obj !== null;

// Should be able to register and login
// if not, we cannot test so much things ...
beforeAll(async () => {
    // We must be able to register
    await request
        .post("/auth/register")
        .set('Content-Type', 'application/json')
        .send(Object.assign({}, user, {fullName: userName}))
        .expect(200);
    const response = await request
        .post("/auth/login")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(user)
        .expect(200);
    JWT_TOKEN = response.body.token;
    expect(typeof JWT_TOKEN).toBe('string')
});

describe("Simple case testing", () => {

    it("POST /api/bulk_create_or_find_tag_categories", async () => {
        const response = await request
            .post("/api/bulk_create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tag_categories)
            .expect(200);
        expect(response.body).toHaveLength(tag_categories.length);
    });

    it("POST /api/tags", async () => {
        const responses = await Promise.all(tags.map(tag => {
            request
                .post("/api/tags")
                .set('Authorization', 'bearer ' + JWT_TOKEN)
                .set('Content-Type', 'application/json')
                .send({text: tag, category_id: getRandomInt(1, tag_categories.length)})
        }));
        expect(responses).toHaveLength(tags.length);
    });

    it("GET /api/tags", async () => {
        const response = await request
            .get("/api/tags")
            .set('Accept', 'application/json')
            .expect(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    it("GET /api/tags_by_categories", async () => {
        const response = await request
            .get("/api/tags_by_categories")
            .set('Accept', 'application/json')
            .expect(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    it("GET /api/tags_by_categories", async () => {
        const response = await request
            .get("/api/tags_categories")
            .set('Accept', 'application/json')
            .expect(200);
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
            data: {
                title: "HELLO WORLD",
                tags: [
                    1,
                    [2, -3, 4],
                    37,
                    -42
                ]
            }
        };
        await search_exercise(0, criteria);
    });

    it("POST /api/search with no parameters", async () => {
        await search_exercise(-1, {});
    });

    it("GET /api/configurations", async () => {
        await request
            .get("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send()
            .expect(200);
    });

    it("PUT /api/configurations without a valid configuration", async () => {
        await request
            .put("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send({
                title: "YOLO",
                tags: [1,2,3],
                name:"YOLO",
                id: 42
            })
            .expect(404);
    });
});

describe("Complex scenarios", () => {
    it("Scenario n°1 : Creates a exercise / Find it / Update it 2 times", async () => {
        // retrieve some tag categories
        let response = await request
            .post("/api/bulk_create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tag_categories)
            .expect(200);
        expect(response.body).toHaveLength(tag_categories.length);

        const tag_categories_ids = response.body.map(category => category.id);
        // create some tags
        response = await Promise.all(tags.map(tag => {
            request
                .post("/api/tags")
                .set('Authorization', 'bearer ' + JWT_TOKEN)
                .set('Content-Type', 'application/json')
                .send({text: tag, category_id: tag_categories_ids[getRandomInt(0, tag_categories_ids.length - 1)]})
        }));
        expect(response).toHaveLength(tags.length);

        // take some tags
        response = await request
            .get("/api/tags")
            .set('Accept', 'application/json')
            .expect(200);
        const some_tags_ids = response.body.map(tag => tag.id).slice(0, tags.length);

        // creates one exercise
        const title = "HELLO WORLD";
        const some_exercise_data = {
            "title": title,
            "description": "Some verrrrrrrrrry long description here",
            // try to use both existent tags and not
            tags: some_tags_ids.concat(
                ["SOME_TAG1", "SOME_TAG2", "SOME_TAG3"].map(tag => ({
                    text: tag,
                    category_id: tag_categories_ids[getRandomInt(0, tag_categories_ids.length - 1)]
                }))
            )
        };
        await request
            .post("/api/bulk_create_exercises")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send([
                some_exercise_data
            ]).expect(200);

        // research this exercise
        const criteria = {
            data: {
                title: title,
                tags: some_tags_ids
            }
        };
        response = await search_exercise(1, criteria);

        let data = response.body.data[0];
        expect(data.version).toBe(0);

        // test most updates cases : keep tags / add & remove
        // 1. Only changed description
        response = await request
            .put("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                title: data.title,
                version: data.version,
                description: data.description + "API4FUN",
                tags: data.tags.map(tag => tag.tag_id)
            });

        expect(response.status).toBe(200);

        response = await request
            .get("/api/exercises/" + data.id)
            .set('Accept', 'application/json');

        expect(response.status).toBe(200);

        expect(isObject(response.body)).toBeTruthy();
        expect(response.body.version).toBe(1);
        expect(response.body.id).toBe(data.id);

        // 2. Add / remove some tags ( difficult case )
        response = await request
            .put("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                title: data.title,
                version: 1,
                description: data.description + "API4FUN",
                tags: data.tags.splice(0, 1).map(tag => tag.tag_id).concat([
                    {text: "TRY 1", category_id: tag_categories_ids[getRandomInt(0, tag_categories_ids.length - 1)]},
                    {text: "TRY 2", category_id: tag_categories_ids[getRandomInt(0, tag_categories_ids.length - 1)]},
                ])
            });

        expect(response.status).toBe(200);

    });

    it("Scenario n°2 : Creates a single exercise with (no) existent tag(s) and add tags later", async () => {
        // retrieve some tag categories
        let response = await request
            .post("/api/bulk_create_or_find_tag_categories")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(tag_categories)
            .expect(200);
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
        response = await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                "title": title,
                "description": "Random exercise",
                "tags": [1, 2, 3, {
                    "text": "JDG",
                    "category_id": 1
                }, {
                    "text": tags[2],
                    "category_id": 1
                }]
            });

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
        const data = response.body.data[0];
        expect(data.version).toBe(0);

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
                ])
            });

        expect(response.status).toBe(200);
        //response = await search_exercise(1, criteria);

    });

    it("Scenario n°3 : Creates a tag proposal / update it and try to recreate one similar", async () => {
        // creates a tag proposal
        await request
            .post("/api/tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({text: "UNVALIDATED_TAG", category_id: 1})
            .expect(200);

        // should be able to retrieve it
        const response = await request
            .get("/api/tags")
            .set('Accept', 'application/json')
            .expect(200);
        const created_tag = response
            .body
            .filter(tag => tag.tag_text === "UNVALIDATED_TAG" && tag.category_id === 1)
            .reduce((_prev, curr) => curr, undefined);

        expect(created_tag).not.toBe(undefined);
        expect(created_tag.version).toBe(0);
        expect(created_tag.isValidated).toBe(false);

        // modify it to validate it
        await request
            .put("/api/tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                tag_id: created_tag.tag_id,
                tag_text: created_tag.tag_text,
                category_id: created_tag.category_id,
                version: created_tag.version,
                isValidated: true
            })
            .expect(200);

        // try to recreate it (for example if someone doesn't see the tag proposal)
        await request
            .post("/api/tags")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({text: "UNVALIDATED_TAG", category_id: 1})
            .expect(200);
    });

    it("Scenario n°4 : Evaluates an exercise : multiple variation", async () => {
        const title = "SOME_EXERCISE_WITH_VOTES";
        // creates a single exercise
        await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                "title": title,
                "description": "Random exercise",
                "tags": [{
                    "text": "JDG",
                    "category_id": 1
                }]
            })
            .expect(200);

        const criteria = {
            data: {
                title: title
            },
            metadata: {
                size: 1
            }
        };

        // retrieve it and send first vote on it
        let response = await search_exercise(1,criteria);
        let data = response.body.data[0];

        // we must check that metrics are correct
        expect(data).toHaveProperty("metrics");
        expect(isObject(data.metrics)).toBeTruthy();
        expect(data.metrics).toHaveProperty("votes");
        expect(data.metrics).toHaveProperty("avg_score");
        expect(data.metrics.votes).toBe(0);
        expect(data.metrics.avg_score).toBe(0);

        // We must be able to register other user to also vote on this exercise
        await request
            .post("/auth/register")
            .set('Content-Type', 'application/json')
            .send(Object.assign({}, user, {fullName: "Super Voter", email: "yolo_voter24@uclouvain.be"}))
            .expect(200);
        // retrieve
        response = await request
            .post("/auth/login")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send(Object.assign({}, user, {email: "yolo_voter24@uclouvain.be"}))
            .expect(200);

        const JWT_TOKEN_2 = response.body.token;

        // User 1 votes for this exercise
        await request
            .post("/api/vote_for_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                exercise_id: data.id,
                score: 3
            })
            .expect(200);

        // We should see the change in this exercise data
        response = await search_exercise(1,criteria);
        expect(response.body.data[0].metrics.votes).toBe(1);
        expect(response.body.data[0].metrics.avg_score).toBe(3);

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
        response = await search_exercise(1,criteria);
        expect(response.body.data[0].metrics.votes).toBe(2);
        expect(response.body.data[0].metrics.avg_score).toBe(2.5);

        // User 1 wants to change his vote for this exercise
        await request
            .post("/api/vote_for_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                exercise_id: data.id,
                score: 5.0
            })
            .expect(200);

        // We should see the change in this exercise data
        response = await search_exercise(1,criteria);
        expect(response.body.data[0].metrics.votes).toBe(2);
        expect(response.body.data[0].metrics.avg_score).toBe(3.5);
    });

    it("Scenario n°5 : Creates a configuration and update it", async () => {
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

        // creates a configuration
        await request
            .post("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                name: "UCLouvain exercises in Java",
                title: "CS1-Java",
                tags: [1]
            })
            .expect(200);

        // should be able to find it in my configurations list
        const response = await request
            .get("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send()
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].tags).toHaveLength(1);
        expect(response.body[0].name).toBe("UCLouvain exercises in Java");
        expect(response.body[0].title).toBe("CS1-Java");

        // should be able to to update it
        await request
            .put("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                name: "UCLouvain 4 FUN",
                title: "CS1-Java",
                tags: [2],
                id: response.body[0].id
            })
            .expect(200);

        // changes should be visible
        const response2 = await request
            .get("/api/configurations")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Accept', 'application/json')
            .send()
            .expect(200);

        expect(response2.body[0].tags).not.toBe(response.body[0].tags);
        expect(response2.body[0].name).not.toBe(response.body[0].name);
        expect(response2.body[0].id).toBe(response.body[0].id);
        expect(response2.body[0].title).toBe(response.body[0].title);
    });
});

describe("Using multipart/form-data (instead of JSON)", () => {
    it("Should be able to create an exercise with a file", async () => {
        await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            //.set('Content-Type', "multipart/form-data")
            .attach("exerciseFile", example_zip_file)
            .field({
                "title": "MULTIPART FORM TESTING 1",
                "description": "HELLO WORLD"
            })
            .field("tags[0][text]", "MULTI PART exercise")
            .field("tags[0][category_id]", 1)
            .expect(200);
    })
});

describe("Validations testing", () => {

    it("POST /login : Wrong content type", async () => {
        await request
            .post("/auth/login")
            .set('Content-Type', 'application/xml')
            .send()
            .expect(415);
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

});

// utilities functions
// to fetch exercise(s)
// if expected_count is equal to -1, we should skip a test
async function search_exercise(expected_count, search_criteria) {
    const response = await request
        .post("/api/search")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(search_criteria)
        .expect(200);

    expect(isObject(response.body)).toBeTruthy();
    expect(Array.isArray(response.body.data)).toBeTruthy();
    if (expected_count !== -1) {
        expect(response.body.metadata.totalItems).toBe(expected_count);
    }
    expect(response.body.data).toHaveLength(response.body.metadata.totalItems);
    return response;
}