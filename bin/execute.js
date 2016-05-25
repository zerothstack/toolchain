#! /usr/bin/env node

process.env.INIT_CWD = process.cwd();

const project = require(process.cwd() + '/ubiquitsfile.js');

project.start(process.argv.slice(2));

