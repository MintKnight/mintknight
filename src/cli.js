#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const nconf = require('nconf');
const { log, title, error, warning, proceed } = require('./term');
const { greet, init, saveUser, addProject } = require('./utils');
const { login, register, logout, info } = require('./actions');
const { newProject, selProject, newWallet, selWallet, newImage, getImages, newContract } = require('./actions');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

const add = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'project': newProject(nconf); break;
    case 'wallet': newWallet(nconf); break;
    case 'image':
      const img = process.argv[4] || false;
      newImage(nconf, img); break;
    case 'contract': newContract(nconf); break;
    case 'drop': addDrop(nconf); break;
    case 'nft': addNft(nconf); break;
	default:
	  error('Invalid element to add (project/image/contract/drop/nft)');
    break;
  }

}

const main = async () => {
  const action = process.argv[2] || false;
  let config = await init(action);
  switch (action) {
    case 'register': register(nconf); break;
    case 'login': login(nconf); break;
    case 'logout': logout(nconf); break;
    case 'add': add(nconf); break;
    case 'project': selProject(nconf); break;
    case 'wallet': selWallet(nconf); break;
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
