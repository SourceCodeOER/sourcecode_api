const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');
const check_user_role = require("../../middlewares/check_user_role");

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
const bulk_modify_exercises_validity = require("./bulk_modify_exercises_validity");

// guarded router middleware
const only_authentified_user = passport.authenticate("jwt", {
    failWithError: true,
    session: false
});

// delegate work of the api in other files
router.use("/exercises", exercises);
router.use("/tags", tags);
router.use("/tags_categories", tags_categories);
router.use("/configurations", only_authentified_user, configurations);
router.put("/bulk_modify_exercises_validity",
    only_authentified_user,
    check_user_role(["admin"]),
    bulk_modify_exercises_validity
);
router.get("/tags_by_categories", tags_by_categories);
router.post("/create_exercise", only_authentified_user, create_exercise);
router.post("/bulk_create_exercises", only_authentified_user, bulk_create_exercises);
router.post("/bulk_create_or_find_tag_categories", only_authentified_user, bulk_create_or_find_tag_categories);
router.post("/vote_for_exercise", only_authentified_user, vote_for_exercise);
router.post("/search", search);

module.exports = router;