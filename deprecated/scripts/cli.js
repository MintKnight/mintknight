#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const prompts = require('prompts');
const chalk = require('chalk');
const nconf = require('nconf');

// Chalk colors.
const log = console.log;
const error = chalk.bold.red;
const warning = chalk.hex('#FFA500'); // Orange color


const main = async () => {
  const home = process.env.HOME || process.env.USERPROFILE;
  log(home);
  // nconf.argv().file({ file: './data/config.json' });
}

main();
