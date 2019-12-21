const express = require('express');
const router = express.Router();

// guarded routes
const passport = require('passport');

// endpoints
const getExerciseByID = require("./getExerciseByID");
const updateExercise = require("./updateExercise");

router.get("/:exerciseId", getExerciseByID);

router.put("/:exerciseId",
    passport.authenticate("jwt", {
        failWithError: true,
        session: false
    }),
    updateExercise
);

module.exports = router;