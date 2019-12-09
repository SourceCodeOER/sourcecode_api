const {readFileSync} = require("fs");
const path = require("path");
const Joi = require('@hapi/joi');

// validation schema
const auto_generated_tags_categories = ["_PLATFORM_", "_SOURCE_", "_COURSE_", "_EXERCISE-TYPE_", "_PROGRAMMING-LANGUAGE_", "_AUTHOR_"];
const linux_absolute_path = /^(?:(\/[^/ ]*)+\/?)$/;
const window_absolute_path = /^[a-zA-Z]:\\.*$/;
const is_absolute_path = new RegExp("(" + linux_absolute_path.source + ")|(" + window_absolute_path.source + ")");

exports = module.exports = {
    "command": "validator",
    "describe": "Check if your JSON result file generated by crawler meet the requirements for other commands ( eg: archiver / uploader)",
    "builder": function (y) {
        return y
            .option("inputFile", {
                alias: "in",
                type: "string",
                description: "Absolute path to a JSON file the validator could check",
            })
            .coerce("inputFile", (arg) => {
                return JSON.parse(readFileSync(path.resolve(arg), 'utf-8'));
            })
            .help()
            .argv;
    },
    "handler": function (argv) {
        mainSchema.validateAsync(argv.inputFile)
            .then(() => console.log("No validation errors detected"))
            .catch((err) => console.error(err));
    }
};

// schemas for validations
const tagsSchema = Joi
    .array()
    .items(
        // either a tag proposal that uses one of the defined category in
        Joi
            .object({
                text: Joi.string().required(),
                category: Joi
                    .ref("/own_categories", {
                        adjust: (v) => Object.values(v),
                        in: true
                    })
            }),
        // either a auto generated tag
        Joi
            .object({
                text: Joi.string().required(),
                autoGenerated: Joi.boolean().truthy().required(),
                category_id: Joi.string().valid(...auto_generated_tags_categories).required()
            })
    )
    .min(1)
    .required();

const archiveSchemas = Joi
    .object({
        folders: Joi
            .array()
            .items(
                Joi
                    .string()
                    .pattern(is_absolute_path, {invert: true})
            )
            .required(),
        files: Joi
            .array()
            .items(
                Joi
                    .string()
                    .pattern(is_absolute_path, {invert: true})
            )
            .required()
    })
    .optional();

const mainSchema = Joi.object({
    // exercises should be an array of exercise object
    exercises: Joi
        .array()
        .required()
        .min(1)
        .items(
            Joi
                .object({
                    title: Joi.string().required(),
                    description: Joi.string().required(),
                    //tags: tagsSchema,
                    url: Joi
                        .string()
                        .optional()
                        .regex(/^https?:\/\/[^\s$.?#].[^\s]*$/)
                        .invalid(null),
                    file: Joi
                        .string()
                        .optional()
                        .pattern(is_absolute_path),
                    archive_properties: archiveSchemas
                })
                .unknown(true)
                .required()
        ),
    // if not empty, it should be a map with strings as keys , value should be string or number
    own_categories: Joi
        .object({})
        .required()
        .pattern(
            Joi.string(),
            Joi.alternatives([Joi.string(), Joi.number()])
        )
})
    .unknown(true)
    .required();