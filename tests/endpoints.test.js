const app = require('../app.js');
const supertest = require('supertest');
const request = supertest(app);

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
        let response = await request
            .post("/api/search")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({
                data: {
                    title: "HELLO WORLD",
                    tags: [
                        1,
                        [2, -3, 4],
                        37,
                        -42
                    ]
                }
            })
            .expect(200);
        expect(isObject(response.body)).toBeTruthy();
        expect(Array.isArray(response.body.data)).toBeTruthy();
        expect(response.body.data).toHaveLength(0);
        expect(response.body.metadata.totalItems).toBe(0);
    });

    it("POST /api/search with no parameters", async () => {
        let response = await request
            .post("/api/search")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send()
            .expect(200);
        expect(isObject(response.body)).toBeTruthy();
        expect(Array.isArray(response.body.data)).toBeTruthy();
        expect(response.body.data).toHaveLength(response.body.metadata.totalItems);
    });
});

describe("Complex scenarios", () => {
    it("Scenario n°1 : Creates a exercises / Find it / Update it 3 times", async () => {
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
        response = await request
            .post("/api/search")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({
                data: {
                    title: title,
                    tags: some_tags_ids
                }
            })
            .expect(200);

        expect(isObject(response.body)).toBeTruthy();
        expect(Array.isArray(response.body.data)).toBeTruthy();
        expect(response.body.data).toHaveLength(1);
        expect(response.body.metadata.totalItems).toBe(1);
        let wrap_exercise_data = ([{title, description, id, version, tags}]) => ({
            title,
            description,
            id,
            version,
            tags
        });
        let data = wrap_exercise_data(response.body.data);
        expect(data.version).toBe(0);

        // test all updates cases : add / remove / keep tags
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

        // 2. Only additions
        response = await request
            .put("/api/exercises/" + data.id)
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                title: response.body.title,
                version: 1,
                description: response.body.description,
                tags: response.body.tags.map(tag => tag.tag_id).concat([
                    {text: "TRY 42", category_id: 1}
                ])
            });

        expect(response.status).toBe(200);
        // 3. Add / remove some tags ( difficult case )

        // I know it should be version 2 but requests are faster than applying the modification
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

    it("Scenario n°2 : Creates a single exercise with (no) existent tag(s)", async () => {
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

        // creates a single exercise
        response = await request
            .post("/api/create_exercise")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send({
                "title": "MEAN_OF_LIFE_42",
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

    });
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

});