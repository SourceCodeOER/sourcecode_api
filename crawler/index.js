#!/usr/bin/env node
const path = require('path');
const {promises: fs, readFileSync} = require("fs");
const supertest = require('supertest');
const DEFAULT_WORKING_FOLDER = path.resolve(__dirname, "./temp");
const PATH_FOR_STRATEGY = path.resolve(__dirname, "./strategies");
const DEBUG_FILE = path.resolve("./results.json");
// TODO later a cleaner way
const USER = {
    "email": "crawler@robot.net",
    "password": "API4FUN"
};

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
    "_PLATFORM_": "plateforme",
    "_SOURCE_": "source",
    "_COURSE_": "cours",
    "_EXERCISE-TYPE_": "type d'exercice",
    "_PROGRAMMING-LANGUAGE_": "langage",
    "_AUTHOR_": "auteur"
};

const argv = require('yargs') // eslint-disable-line
    .option("apiBaseUrl", {
        type: "string",
        description: "URL of the API server",
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
    .config("settings", "settings for strategy + crawler", (configPath) => {
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

// Credits to https://gist.github.com/JamieMason/0566f8412af9fe6a1d470aa1e089a752
const groupBy = key => array =>
    array.reduce((objectsByKeyValue, obj) => {
        const value = obj[key];
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
    }, {});

async function send_to_API(argv, results) {

    const request = supertest(argv.apiBaseUrl);

    try {
        await request
            .post("/auth/register")
            .set('Content-Type', 'application/json')
            .send(Object.assign({}, USER, {fullName: "ROBOTOR_42"}))
            .expect(200);
    } catch (e) {
        console.log("ROBOT already exists : skip register")
    }

    let response = await request
        .post("/auth/login")
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(USER)
        .expect(200);

    const JWT_TOKEN = response.body.token;

    const tags_categories = Object
        .values(AUTO_GENERATED_TAG_CATEGORIES)
        .concat(Object.values(results["own_categories"]));

    response = await request
        .post("/api/bulk_create_or_find_tag_categories")
        .set('Authorization', 'bearer ' + JWT_TOKEN)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(tags_categories)
        .expect(200);

    const tags_categories_ids = response.body;
    const tags_dictionary = groupBy("category")(tags_categories_ids);

    // If the user wants to upload files
    const files = results["exercises"]
        .map((exercise, index) => ({
            has_file: exercise.hasOwnProperty("file"),
            index: index,
            file: exercise.file
        }))
        .filter(exercise => exercise.has_file === true)
        .map(exercise => ({
            filename: path.basename(exercise.file),
            exercise: exercise.index,
            path: exercise.file
        }));

    // convert exercises to the given format in API
    const exercises = results["exercises"].map(exercise => {

        // handle tags conversion here to match what we have in API
        const tags = exercise["tags"].map(tag => {
            // Since crawler doesn't care about existent tags of not, they will be encoded as TagProposal
            return {
                text: tag.text,
                category_id: (tag.hasOwnProperty("autoGenerated") && tag.autoGenerated === true)
                    ? tags_dictionary[AUTO_GENERATED_TAG_CATEGORIES[tag["category_id"]]][0].id
                    : tags_dictionary[results["own_categories"][tag["category"]]][0].id
            }

        });
        // remove the file (already done before)
        delete exercise.file;

        return Object.assign({}, exercise, {tags: tags});
    });

    // Upload that on API

    // if no files, use the simplest way
    if (files.length === 0) {
        await request
            .post("/api/bulk_create_exercises")
            .set('Authorization', 'bearer ' + JWT_TOKEN)
            .set('Content-Type', 'application/json')
            .send(exercises)
            .expect(200);
    } else {
        await bulk_insert_request(request, JWT_TOKEN, exercises, files);
    }
}

// To construct requests that uses multipart/form-data
async function bulk_insert_request(request, JWT_TOKEN, exercises, files) {
    // the most complicated thing :
    let requestInstance = request
        .post("/api/bulk_create_exercises")
        .set('Authorization', 'bearer ' + JWT_TOKEN);

    // Add all given files
    for (const file of files) {
        requestInstance.attach("files", file.path)
    }

    // Add the mapping between exercises and files
    files.forEach((file, index) => {
        const sub_field = "filesMapping[" + index + "]";
        requestInstance.field(sub_field + "[filename]", file.filename);
        requestInstance.field(sub_field + "[exercise]", file.exercise);
    });

    // Add the exercises metadata
    exercises.forEach((exercise, index) => {
        // since tags are more complicated to deal with, I must handle them separately
        const exercise_tags = exercise.tags;
        delete exercise.tags;

        const sub_field = "exercisesData[" + index + "]";
        // for other properties of exercise, it is pretty easy to handle them
        Object.entries(exercise).forEach(([key, value]) => {
            requestInstance.field(sub_field + "[" + key + "]", value);
        });

        // for tags, we have to use this ugly way because of supertest
        const sub_tag_field = sub_field + "[tags]";
        exercise_tags.forEach((tag, index) => {
            const sub_tag_field_index = sub_tag_field + "[" + index + "]";
            Object.entries(tag).forEach(([key, value]) => {
                requestInstance.field(sub_tag_field_index + "[" + key + "]", value);
            });
        });
    });
    // TODO improve errors warning
    await requestInstance.expect(200);
}