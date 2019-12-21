const express = require('express');
const router  = express.Router();

const auth = require("./auth");
const api = require("./api");

// for auth endpoints
router.use("/auth", auth);
// for api endpoints
router.use("/api", api);

module.exports = router;