const app = require('../app.js');
const supertest = require('supertest');
const request = supertest(app);

const user = {
    email: "yolo24@uclouvain.be",
    password: "API4LIFE"
};
const userName = "Eric Cartman";

let JWT_TOKEN = "";

// Should be able to register and login
// if not, we cannot test so much things ...
beforeAll(async () => {
    // We must be able to register
    await request
        .post("/auth/register")
        .set('Content-Type', 'application/json')
        .send(
            Object.assign({}, user, {fullName: userName})
        )
        .expect(200);
    await request
        .post("/auth/login")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(user)
        .expect(200)
        .then(response => {
            JWT_TOKEN = response.body.token;
        });
    expect(typeof JWT_TOKEN).toBe('string')
});

describe('Sample Test', () => {
    it('should test that true === true', () => {
        expect(true).toBe(true)
    })
});