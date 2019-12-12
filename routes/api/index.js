const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');

const exercises = require("./exercises");
const tags = require("./tags");
const tags_categories = require("./tags_categories");
const configurations = require("./configurations");
const create_exercise = require("./create_exercise");
const search = require("./search");
const tags_by_categories = require("./tags_by_categories");
const bulk_create_exercises = require("./bulk_create_exercises");
const bulk_create_or_find_tag_categories = require("./bulk_create_or_find_tag_categories");
const vote_for_exercise = require("./vote_for_exercise");

// delegate work of the api in other files
router.use("/exercises", exercises);
router.use("/tags", tags);
router.use("/tags_categories", tags_categories);
router.use("/configurations", passport.authenticate("jwt", {
    failWithError: true,
    session: false
}), configurations);
router.post("/create_exercise", passport.authenticate("jwt", {
    failWithError: true,
    session: false
}), create_exercise);
router.post("/bulk_create_exercises", passport.authenticate("jwt", {
    failWithError: true,
    session: false
}), bulk_create_exercises);
router.post("/bulk_create_or_find_tag_categories", passport.authenticate("jwt", {
    failWithError: true,
    session: false
}), bulk_create_or_find_tag_categories);
router.post("/vote_for_exercise", passport.authenticate("jwt", {
    failWithError: true,
    session: false
}), vote_for_exercise);
router.post("/search", search);
router.get("/tags_by_categories", tags_by_categories);

module.exports = router;