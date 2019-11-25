#!/usr/bin/env node
const path = require('path');
const {promises: fs, readFileSync} = require("fs");
const OpenAPIClientAxios = require('openapi-client-axios').default;
const DEFAULT_WORKING_FOLDER = path.resolve(__dirname, "./temp");
const PATH_FOR_STRATEGY = path.resolve(__dirname, "./strategies");
const DEBUG_FILE = path.resolve("./results.json");
const API_FILE = path.resolve("../api.yml");

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

// Auto generated tags
// if we want to map them to another name, we can do that easily ( Here : English TO French )
const AUTO_GENERATED_TAG_CATEGORIES = {
    "_PLATFORM_": "Plateforme",
    "_SOURCE_": "Source",
    "_COURSE_": "Cours",
    "_EXERCISE-TYPE_": "Type d'exercise",
    "_PROGRAMMING-LANGUAGE_": "Langage de programmation",
    "_AUTHOR_": "Auteur"
};

const argv = require('yargs') // eslint-disable-line
    .option("apiBaseUrl", {
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
    .option("resultFile", {
        alias: "out",
        type: "string",
        description: "Absolute path to a JSON file the crawler could write its results",
        default: DEBUG_FILE
    })
    .option("apiFile", {
        type: "string",
        default: API_FILE,
        description: "Path to the OpenAPI file that describe our API"
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
    .config("settings", "settings for strategy", (configPath) => {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
    })
    .check(demandOneOfOption("custom_strategy", "strategy")) // at least one of two is set
    .help()
    .argv;

// recreate the working directory
fs
    .mkdir(argv.workingDirectory, {recursive: true})
    .then(() => {
        fetch_and_save_results(argv)
            .then()
            .then((results) => {
                return argv.mustSend ? send_to_API(argv, results) : Promise.resolve();
            })
    })
    .catch((err) => {
        console.error(err);
    });

async function fetch_and_save_results(argv) {
    // If custom script, invoke this to get results
    try {
        const results =
            (argv.hasOwnProperty("custom_strategy"))
                ? await require(argv.custom_strategy)(argv)
                : await require(path.resolve(PATH_FOR_STRATEGY, argv.strategy))(argv);
        if (argv.debug) {
            await fs.writeFile(argv.resultFile, JSON.stringify(results, null, 4));
        }
        console.log("SUCCESSFULLY SAVED THE RESULTS");
        return await Promise.resolve(results)
    } catch (e) {
        return await Promise.reject(e);
    }
}

async function send_to_API(argv, results) {
    const api = new OpenAPIClientAxios({
        definition: argv.apiFile,
        axiosConfigDefaults: {
            url: argv.apiBaseUrl
        }
    });
    await api.init();
    const client = await api.getClient();
    console.log()
    // TODO some query here
}