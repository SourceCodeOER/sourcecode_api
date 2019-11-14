const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');

const exercises = require("./api/exercises");
const tags = require("./api/tags");
const create_exercise = require("./api/create_exercise");
const search = require("./api/search");
const tags_categories = require("./api/tags_categories");
const tags_by_categories = require("./api/tags_by_categories");

// delegate work of the api in other files
router.use("/exercises", exercises);
router.use("/tags", tags);
router.post("/create_exercise", passport.authenticate("jwt", {
    failWithError: true,
    session: false
}), create_exercise);
router.post("/search", search);
router.get("/tags_categories", tags_categories);
router.get("/tags_by_categories", tags_by_categories);

module.exports = router;