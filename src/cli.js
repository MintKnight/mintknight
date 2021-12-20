#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const nconf = require('nconf');
const { log, title, error, warning, proceed } = require('./term');
const { greet, init, saveUser, addProject } = require('./utils');
const { login, register, logout, info } = require('./actions');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

const main = async () => {
  const action = process.argv[2] || false;
  let config = await init(action);
  switch (action) {
    case 'register': register(nconf); break;
    case 'login': login(nconf); break;
    case 'logout': logout(nconf); break;
    default: info(nconf); break;
  }
  return;


  const user = config.get('user');
  console.log(config.get('user'));
  if (!user.email) {
    warning('\nThis is the first time using mintknight');
    log('The first time you need to create an account and save your information');
    // Save user to conf.
    await saveUser(await promptUser());
    await addProject(await promptProject());
    config = await init();
  }
  console.log(config.get('user:email'));
}

main();
