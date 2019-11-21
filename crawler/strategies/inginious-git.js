const simpleGitModule = require('simple-git/promise');
const FileHound = require('filehound');
const partition = require('lodash.partition');
const groupBy = require('lodash.groupby');

const yaml = require('js-yaml');
const fs = require('fs').promises;
const readFileSync = require("fs").readFileSync;

// Handle tag crawling for INGINIOUS tasks on one GIT
module.exports = async function (options) {
    const {
        workingDirectory,
        url: gitURL
    } = options;

    // git clone the given folder in workingDir
    const simpleGit = simpleGitModule(workingDirectory);

    try {
        // Clone the given git
        // TODO don't clone if already present ; fs.readDir
        await simpleGit.clone(gitURL);
        // Find course.yaml and task.yaml files
        const files = await FileHound
            .create()
            .paths(workingDirectory)
            .ext("yaml")
            // some inginious tasks use config files like "feedback_settings.yaml", exclude them from result)
            .glob("*course.yaml", "*task.yaml")
            .find();

        // separate the course(s) and task(s) data
        const [courses_data, exercises_data] = partition(files, (file) => file.endsWith("course.yaml"));

        // the hard part here
        // As Inginious uses at least 2 versions for their tag system, this script tries to handle both :
        // In V1, tags can be directly found in their task.yaml
        // In V2, they must be first present in course.yaml , then referenced in task.yaml

        // 1. Get a dictionary of course metadata
        const courses = groupBy(
            courses_data
                .map(course_data => {
                        // parse the given yaml file
                        const doc = yaml.safeLoad(readFileSync(course_data, 'utf8'));
                        // if we can find some tags, extract them
                        return {
                            "all_tags": extract_tags(doc, "tags"), // all the given tags
                            "name": doc.name,
                            "path": course_data, // useful for later
                        };
                    }
                )
            , "path");

        // 2. Get an array of tags metadata
        // As said before, V1 and V2 have a few differences :
        // for a task, V2 only use the tags under the "categories" key of a task.yaml
        // for V1

        // Copied from https://github.com/UCL-INGI/INGInious/blob/master/inginious/common/tags.py
        // as it is referred nowhere in INGINIOUS docs :
        /*
            The 'type' represents the behaviour of the tag:
            - 0: Skill tags. It appear in blue. When the tag is activated it becomes green.
                 We can perform tasks search on this tag.
            - 1: Misconception tags. It does not appear until it is activated. It appear in red when activated.
                 We can NOT perform tasks search on this tag.
                 The tags are useful to highlight errors or misconceptions.
            - 2: Category tags. Never appear. Only used for organisation and when we perform tasks search.
        */
        const exercises = exercises_data.map(exercise_data => {
            // parse the given yaml file
            const doc = yaml.safeLoad(readFileSync(exercise_data, 'utf8'));
            // if we can find the related course metadata , use that to get more info on this exercise
            // Warning : as path , we must take the most specialized one ( aka the longest string )
            const course_match = Object
                .keys(courses)
                .filter(s => exercise_data.includes(s))
                .reduce((a, b) => a.length > b.length ? a : b, '');
            const course_data = (course_match.length > 0) ? courses[course_match] : {};

            // To distinguish categories, I must have a criteria :
            // If the tag has the "autoGenerated" flag set to "true", it means the category is coming from the generator
            // For security, I use _ around the name to prevent match(s) with others
            let auto_tags = auto_generate_tags_for_exercise(course_data, doc);

            // all the given tags by users
            let found_tags = found_tags_for_exercise(course_data, doc);

            return {
                "title": doc.name,
                "description": (doc.hasOwnProperty("context")) ? doc.context : "", // it is optional on Inginious
                "tags": auto_tags.concat(found_tags) // merge them in a single array
            }
        });

        return {
            "exercises": exercises,
            // if the given platform has its own categories for tag, use them
            "own_categories": {
                0: "Skill",
                1: "Misconception",
                2: "Category"
            }
        }


    } catch (e) {
        console.error(e);
        return {};
    }

};

// function to extract tags in the given yaml file object, under the given rootLey
function extract_tags(doc, rootLey) {
    if (doc.hasOwnProperty(rootLey)) {
        // only takes their id, text and type attributes
        // rest like "visible", "description", etc.. aren't useful for us (yet)
        return Object
            .entries(doc[rootLey])
            .reduce((acc, [key, value]) => {
                // to handle both V1 and V2 case as tags can be found in course.yaml and task.yaml
                // In LSINF1252, they used unvalidated tags in their task.yaml
                const real_key = (value.hasOwnProperty("id")) ? value.id : key;
                acc[real_key] = {
                    id: real_key,
                    text: value.name,
                    category: value.type
                };
                return acc;
            }, {});
    } else {
        return {};
    }
}

// Function to add autogenerated Tag for given exercise
function auto_generate_tags_for_exercise(course_data, exercise_data) {
    let tags = [];

    // add platform of this exercise : INGINIOUS
    tags.push({
        text: "INGINIOUS",
        autoGenerated: true,
        category_id: "_PLATFORM_"
    });

    // If we can retrieve the course name, we could add course as tag
    if (course_data.hasOwnProperty("name")) {
        tags.push({
            text: course_data.name,
            autoGenerated: true,
            category_id: "_COURSE_"
        })
    }

    // If we can retrieve the author(s), we could add author as tag
    if (exercise_data.hasOwnProperty("author")) {
        tags.push({
            text: exercise_data.author,
            autoGenerated: true,
            category_id: "_AUTHOR_"
        })
    }

    return tags;
}

function found_tags_for_exercise(course_data, exercise_data) {

    // V2 : tags can be found in "categories" key in task.yaml
    // It is only an array of ids so we must retrieve the full tag data from course.yaml
    let tags = (exercise_data.hasOwnProperty("categories"))
        ? exercise_data.categories
            .map(categoryId => course_data.all_tags[categoryId])
        // V1 : tags can be found in "tags" key in task.yaml
        :
            Object.values(
                extract_tags(exercise_data, "tags")
            );

    // Remove unused properties ( id )
    tags.forEach(function(v){
        delete v.id
    });

    return tags;
}