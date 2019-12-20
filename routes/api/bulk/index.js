// endpoints
const bulk_create_exercises = require("./bulk_create_exercises");
const bulk_create_or_find_tag_categories = require("./bulk_create_or_find_tag_categories");
const bulk_modify_exercises_validity = require("./bulk_modify_exercises_validity");
const bulk_delete_exercises = require("./bulk_delete_exercises");

// routes
const express = require('express');
const router = express.Router();

// guarded endpoints
const check_user_role = require("../../../middlewares/check_user_role");

// bulk actions allowed for any user/admin (some preconditions could be present)
router.delete("/delete_exercises", bulk_delete_exercises);
router.post("/create_exercises", bulk_create_exercises);

// only for admins
router.put("/modify_exercises_validity",
    check_user_role(["admin"]),
    bulk_modify_exercises_validity
);

router.post("/create_or_find_tag_categories",
    check_user_role(["admin"]),
    bulk_create_or_find_tag_categories
);

module.exports = router;
