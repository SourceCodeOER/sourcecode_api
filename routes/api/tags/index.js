const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');
// guarded router middleware
const only_authentified_user = passport.authenticate("jwt", {
    failWithError: true,
    session: false
});
const check_user_role = require("../../../middlewares/check_user_role");

// endpoints
const getTags = require("./getTags");
const submitTagProposal = require("./submitTagProposal");
const updateTag = require("./updateTag");

// for fetching
router.get("/", getTags);
// For update
router.put("/", only_authentified_user, check_user_role(["admin"]), updateTag);
// create a Tag Proposal
router.post("/", only_authentified_user, submitTagProposal);


module.exports = router;