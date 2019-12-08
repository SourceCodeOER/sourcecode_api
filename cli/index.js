#!/usr/bin/env node

require('yargs')
    .command(require('./commands/crawler'))
    .command(require('./commands/uploader'))
    .help()
    .argv;