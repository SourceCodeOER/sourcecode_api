// routes
const express = require('express');
const router = express.Router();

// endpoints
const createConfiguration = require("./createConfiguration");
const fetchOwnConfigurations = require("./fetchOwnConfigurations");
const updateConfiguration = require("./updateConfiguration");

router.get("/", fetchOwnConfigurations);
router.post("/", createConfiguration);
router.put("/", updateConfiguration);

module.exports = router;