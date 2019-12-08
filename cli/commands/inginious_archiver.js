const {promises: fs, readFileSync} = require("fs");
const archiver = require('archiver');

exports = module.exports = {
    "command": "inginious-archiver",
    "describe": "Generate zip archives from inginious exercises using the crawler JSON results file",
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
                description: "Absolute path to the base folder where are located the inginious exercises described in inputFile",
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
    }
};