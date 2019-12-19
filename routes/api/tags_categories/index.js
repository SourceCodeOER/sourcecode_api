const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');
const check_user_role = require("../../../middlewares/check_user_role");

// endpoints
const getTagCategories = require("./getTagCategories");
const updateTagCategory = require("./updateTagCategory");

router.get("/", getTagCategories);

router.put("/",
    passport.authenticate("jwt", {
        failWithError: true,
        session: false
    }),
    check_user_role(["admin"]),
    updateTagCategory
);

module.exports = router;