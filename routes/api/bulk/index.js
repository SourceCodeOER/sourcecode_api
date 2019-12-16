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

// as the common path start by /bulk_ (maybe rewrite that soon )
router.delete("/bulk_delete_exercises",
    check_user_role(["admin"]),
    bulk_delete_exercises
);

router.put("/bulk_modify_exercises_validity",
    check_user_role(["admin"]),
    bulk_modify_exercises_validity
);

router.post("/bulk_create_exercises", bulk_create_exercises);
router.post("/bulk_create_or_find_tag_categories",
    check_user_role(["admin"]),
    bulk_create_or_find_tag_categories
);

module.exports = router;
