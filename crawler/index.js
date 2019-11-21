#!/usr/bin/env node
const path = require('path');
const fs = require("fs").promises;
const DEFAULT_WORKING_FOLDER = path.resolve(__dirname, "./temp");
const PATH_FOR_STRATEGY = path.resolve(__dirname, "./strategies");
const DEBUG_FILE = path.resolve("./results.json");

// Credits to https://github.com/yargs/yargs/issues/1093#issuecomment-491299261
const demandOneOfOption = (...options) => (argv) => {
    const count = options.filter(option => argv[option]).length;
    const lastOption = options.pop();
    if (count === 0) {
        throw new Error(`Exactly one of the arguments ${options.join(', ')} and ${lastOption} is required`);
    } else if (count > 1) {
        throw new Error(`Arguments ${options.join(', ')} and ${lastOption} are mutually exclusive`);
    }
    return true;
};

const argv = require('yargs') // eslint-disable-line
    .option("url", {
        alias: "u",
        type: "string",
        description: "URL of the API server (to override the one in documentation)",
        default: "localhost:3000"
    })
    .option("strategy", {
        alias: "s",
        type: "string",
        description: "Name of the already implemented strategy you want to use",
        choices: ["inginious-git"]
    })
    .option("custom_strategy", {
        alias: "cs",
        type: "string",
        description: "Absolute path to a JS file implementing your strategy (see docs for more info)"
    })
    .option("workingDirectory", {
        alias: "w",
        type: "string",
        description: "Absolute path to a folder where the crawler can do its stuff",
        default: DEFAULT_WORKING_FOLDER
    })
    .option("debug", {
        type: "boolean",
        default: false,
        description: "If true, creates a results.json file (override if already present) with the results of given strategy"
    })
    .option("mustSend", {
        default: true,
        type: "boolean",
        description: "Must we send the extracted results to API ?"
    })
    .coerce("workingDirectory", (arg) => {
        return path.resolve(arg);
    })
    .config("settings", "settings for strategy",(configPath) => {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    })
    .check(demandOneOfOption("custom_strategy", "strategy")) // at least one of two is set
    .help()
    .argv;

// settings
const settings = Object.assign({}, argv.settings || {}, {
    workingDir: argv.workingDirectory
});

// recreate the working directory
fs
    .mkdir(argv.workingDirectory, {recursive: true})
    .then(() => {
        // If custom script, invoke this to get results
        // TODO find a way to send custom properties here
        const results =
            (argv.hasOwnProperty("custom_strategy"))
                ? require(argv.custom_strategy)(settings)
                : require(path.resolve(PATH_FOR_STRATEGY, argv.strategy))(settings);

        // must we debug that later
        if (argv.debug) {
            // print pretty json
            fs.writeFile(DEBUG_FILE, JSON.stringify(results, null, 4))
                .then(() => {
                    console.log("SUCCESSFULLY SAVED THE RESULTS")
                })
                .catch((err) => {
                    console.error(err);
                });
        }

        // TODO part of sending the extract results
        if (argv.mustSend) {

        }
    })
    .catch((err) => {
        console.error(err);
    });