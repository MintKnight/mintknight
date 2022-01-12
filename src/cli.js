#!/usr/bin/env node
const nconf = require('nconf');
const { error } = require('./term');
const { init } = require('./utils');
const { Actions } = require('./actions');

const add = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'project': Actions.newProject(nconf); break;
    case 'wallet': Actions.newWallet(nconf); break;
    case 'contract': Actions.newContract(nconf); break;
    case 'media': Actions.newMedia(nconf, process.argv[4] || false); break;
	default:
	  error('Invalid element to add (project/wallet/contract/media)');
    break;
  }
}

const select = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'project': Actions.selProject(nconf); break;
    case 'wallet': Actions.selWallet(nconf); break;
    case 'contract': Actions.selContract(nconf); break;
	default:
	  error('Invalid element to select (wallet/project/contract)');
    break;
  }
}

const list = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'media': Actions.listMedia(nconf); break;
	default:
	  error('Invalid element to list (media)');
    break;
  }
}
     
const main = async () => {
  const action = process.argv[2] || false;
  init(action);
  switch (action) {
    case 'help': Actions.help(); break;
    case 'setup': Actions.setup(nconf); break;
    case 'debug': Actions.toggleDebug(nconf); break;
    case 'register': Actions.register(nconf); break;
    case 'add': add(nconf); break;
    case 'select': select(nconf); break;
    case 'list': list(nconf); break;
    case 'mint': Actions.mint(nconf); break;
    default:
      Actions.info(nconf);
	  (action !== false) && error('Invalid action');
      break;
  }
  return;
}

main();
