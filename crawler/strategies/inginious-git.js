const simpleGitModule = require('simple-git/promise');
const FileHound = require('filehound');
const partition = require('lodash.partition');

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
        await simpleGit.clone(gitURL);
        // Find course.yaml and task.yaml files
        const files = await FileHound
            .create()
            .paths(workingDir)
            .ext("yaml")
            // some inginious tasks use config files like "feedback_settings.yaml", exclude them from result)
            .glob("*course.yaml", "*task.yaml")
            .find();

        // separate the
        const [courses_data, exercises_data] = partition(files, (file) => file.endsWith("course.yaml"));

        // the hard part here : process every exercise data
        // As Inginious uses at least 2 versions for their tag system, this script tries to handle both

        // In V1, tags can be directly found in their task.yaml
        // In V2, they must be first present in course.yaml , then referenced in task.yaml

    } catch (e) {
        return {};
    }

};