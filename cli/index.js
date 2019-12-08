#!/usr/bin/env node

require('yargs')
    .command(require('./commands/crawler'))
    .command(require('./commands/uploader'))
    .command(require("./commands/inginious_archiver"))
    .help()
    .argv;