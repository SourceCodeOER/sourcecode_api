const simpleGitModule = require('simple-git/promise');
const FileHound = require('filehound');
const partition = require('lodash.partition');
const groupBy = require('lodash.groupby');

const yaml = require('js-yaml');
const fs = require('fs').promises;

// Handle tag crawling for INGINIOUS tasks on one GIT
module.exports = async function (options) {
    const {
        workingDir,
        url: gitURL
    } = options;

    // git clone the given folder in workingDir
    const simpleGit = simpleGitModule(workingDir);

    try {
        // Clone the given git
        // TODO don't clone if already present ; fs.readDir
        await simpleGit.clone(gitURL);
        // Find course.yaml and task.yaml files
        const files = await FileHound
            .create()
            .paths(workingDir)
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
                        const doc = yaml.safeLoad(fs.readFileSync(course_data, 'utf8'));
                        // if we can find some tags, extract them
                        return {
                            "all_tags": extract_tags(doc, "tags"), // all the given tags
                            "course_name": doc.name,
                            "file_location": course_data, // useful for later
                        };
                    }
                )
            , "course_path");

    } catch (e) {
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
                acc[key] = {
                    id: key,
                    text: value.name,
                    category: value.type
                };
                return acc;
            }, {});
    } else {
        return {};
    }
}