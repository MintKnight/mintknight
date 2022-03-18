#!/usr/bin/env node
const nconf = require('nconf');
const { error } = require('./term');
const { init } = require('./utils');
const { Actions } = require('./actions');
const { Test } = require('./test');

const add = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'project':
      Actions.newProject(nconf);
      break;
    case 'wallet':
      Actions.newWallet(nconf, 'onchain');
      break;
    case 'signer':
      Actions.newWallet(nconf, 'signer');
      break;
    case 'contract':
      Actions.newContract(nconf);
      break;
    case 'drop':
      Actions.newDrop(nconf);
      break;
    case 'dropstrategy':
      Actions.newDropStrategy(nconf);
      break;
    case 'dropcode':
      Actions.newDropCode(nconf);
      break;
    case 'media':
      Actions.newMedia(nconf, process.argv[4] || false);
      break;
    default:
      error(
        'Invalid element to add (project, wallet, signer, contract, drop, dropstrategy, dropcode, media)'
      );
      break;
  }
};

const select = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'project':
      Actions.selProject(nconf);
      break;
    case 'wallet':
      Actions.selWallet(nconf);
      break;
    case 'contract':
      Actions.selContract(nconf);
      break;
    default:
      error('Invalid element to select (wallet/project/contract)');
      break;
  }
};

const list = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'media':
      Actions.listMedia(nconf);
      break;
    case 'nft':
      Actions.listNft(nconf);
      break;
    case 'drop':
      Actions.listDrop(nconf);
      break;
    case 'dropstrategy':
      Actions.listDropStrategy(nconf);
      break;
    case 'dropcode':
      Actions.listDropCode(nconf);
      break;
    default:
      error(
        'Invalid element to list (media, nft, drop, dropstrategy, dropcode)'
      );
      break;
  }
};

const info = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'nft':
      Actions.infoNft(nconf);
      break;
    case 'wallet':
      Actions.infoWallet(nconf);
      break;
    case 'project':
      Actions.infoProject(nconf);
      break;
    case 'contract':
      Actions.infoContract(nconf);
      break;
    case 'wallet':
      Actions.infoWallet(nconf);
      break;
    default:
      error('Invalid element to get info (project, wallet, nft, wallet)');
      break;
  }
};

const update = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'nft':
      Actions.updateNft(nconf);
      break;
    case 'project':
      Actions.updateLimits(nconf);
      break;
    case 'minter':
      Actions.updateContract(nconf, 'minter');
      break;
    case 'owner':
      Actions.updateContract(nconf, 'owner');
      break;
    case 'prices':
      Actions.updatePrices(nconf);
      break;
    case 'verifier':
      Actions.updateVerifier(nconf);
      break;
    case 'drop':
      Actions.updateDrop(nconf);
      break;
    case 'dropstrategy':
      Actions.updateDropStrategy(nconf);
      break;
    case 'dropcode':
      Actions.updateDropCode(nconf);
      break;
    default:
      error(
        'Invalid element to update (nft, minter, owner, verifier, prices, drop, dropstrategy, dropcode)'
      );
      break;
  }
};

const uploadBulk = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'nft':
      Actions.uploadBulkNFTs(nconf);
      break;
    case 'dropcode':
      Actions.uploadBulkDropCodes(nconf);
      break;
    default:
      error('Invalid element to upload bulk (nft, dropcode)');
      break;
  }
};

const main = async () => {
  const action = process.argv[2] || false;
  init(action);
  switch (action) {
    case 'help':
      Actions.help();
      break;
    case 'test':
      if (process.argv[3] && process.argv[3] === 'buy') {
        Test.buy(nconf);
      } else {
        Test.go(nconf);
      }
      break;
    case 'setup':
      Actions.setup(nconf);
      break;
    case 'debug':
      Actions.toggleDebug(nconf);
      break;
    case 'register':
      Actions.register(nconf);
      break;
    case 'add':
      add(nconf);
      break;
    case 'select':
      select(nconf);
      break;
    case 'list':
      list(nconf);
      break;
    case 'info':
      info(nconf);
      break;
    case 'update':
      update(nconf);
      break;
    case 'mint':
      Actions.mint(nconf);
      break;
    case 'transfer':
      Actions.transfer(nconf);
      break;
    case 'sign':
      Actions.sign(nconf);
      break;
    case 'upload-bulk':
      uploadBulk(nconf);
      break;
    case 'test':
      break;
    case 'update':
      update(nconf);
      break;
    default:
      Actions.info(nconf);
      action !== false && error('Invalid action');
      break;
  }
};

main();
