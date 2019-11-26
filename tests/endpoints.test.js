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
});

test("Complex scenario : Creates a exercises / Find it / Update it 3 times", async () => {
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
            .send({text: tag, category_id: tag_categories_ids[getRandomInt(0, tag_categories_ids.length)]})
    }));
    expect(response).toHaveLength(tags.length);
    // take some tags
    response = await request
        .get("/api/tags")
        .set('Accept', 'application/json')
        .expect(200);
    const some_tags_ids = response.body.map(tag => tag.id).slice(0, tags.length);

});
