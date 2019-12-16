const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');

// router
const exercises = require("./exercises");
const tags = require("./tags");
const tags_categories = require("./tags_categories");
const configurations = require("./configurations");
const bulk_endpoints = require("./bulk");

// single endpoints
const create_exercise = require("./create_exercise");
const search = require("./search");
const tags_by_categories = require("./tags_by_categories");
const vote_for_exercise = require("./vote_for_exercise");

// guarded router middleware
const only_authentified_user = passport.authenticate("jwt", {
    failWithError: true,
    session: false
});

// single router handled here
router.get("/tags_by_categories", tags_by_categories);
router.post("/create_exercise", only_authentified_user, create_exercise);
router.post("/vote_for_exercise", only_authentified_user, vote_for_exercise);
router.post("/search", search);

// delegate work of the api in other files router
router.use("/exercises", exercises);
router.use("/tags", tags);
router.use("/tags_categories", tags_categories);
router.use("/configurations", only_authentified_user, configurations);
router.use(only_authentified_user, bulk_endpoints);

module.exports = router;