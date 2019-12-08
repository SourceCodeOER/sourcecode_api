const {promises: fs, readFileSync, existsSync} = require("fs");
const path = require("path");
const archiver = require('archiver');

exports = module.exports = {
    "command": "archiver",
    "describe": "Generate zip archives from exercises using the crawler JSON results file",
    "builder": function (y) {
        return y
            .option("inputFile", {
                alias: "in",
                type: "string",
                description: "Absolute path to a JSON file the archiver could read crawler result",
            })
            .option("outputFile", {
                alias: "out",
                type: "string",
                description: "Absolute path to a JSON file the archiver could saves its results",
            })
            .option("baseFolder", {
                type: "string",
                description: "Absolute path to the base folder where are located the exercises described in inputFile",
                alias: "root"
            })
            .config("settings", "Absolute path to a JSON config file for archiver", (configPath) => {
                return JSON.parse(readFileSync(path.resolve(configPath), 'utf-8'));
            })
            .coerce("baseFolder", (arg) => {
                return path.resolve(arg);
            })
            .coerce("outputFile", (arg) => {
                return path.resolve(arg);
            })
            .coerce("inputFile", (arg) => {
                return JSON.parse(readFileSync(path.resolve(arg), 'utf-8'));
            })
            .help()
            .argv;
    },
    "handler": function (argv) {
        // TODO
        const updated_exercises = argv.inputFile.exercises.map(exercise => {
            // to skip some exercises that doesn't have file or have already a file
            if (!exercise.hasOwnProperty("archive_properties") || exercise.hasOwnProperty("file")) {
                return exercise;
            }
            if (exercise.hasOwnProperty("archive_properties")) {
                console.log("")
            }
            return exercise;
        });
        console.log();
    }
};

const exists = (dir) => {
    try {
        return existsSync(dir);
    } catch (e) {
        return false;
    }
};