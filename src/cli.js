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
    case 'eoa':
      Actions.newWallet(nconf, 'eoa');
      break;
    case 'contract':
      Actions.newContract(nconf);
      break;
    case 'nft':
      Actions.newNFT(nconf);
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
    case 'dropuser':
      Actions.newDropUser(nconf);
      break;
    case 'media':
      Actions.newMedia(nconf, process.argv[4] || false);
      break;
    default:
      error(
        'Invalid element to add (project, wallet, signer, contract, drop, dropstrategy, dropcode, dropuser, media)'
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
    case 'dropuser':
      Actions.listDropUser(nconf);
      break;
    case 'projects':
      Actions.listProjects(nconf);
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
    case 'project':
      Actions.infoProject(nconf);
      break;
    case 'wallet':
      Actions.infoWallet(nconf);
      break;
    case 'contract':
      Actions.infoContract(nconf);
      break;
    case 'nft':
      Actions.infoNft(nconf);
      break;
    case 'token':
      Actions.infoToken(nconf);
      break;
    default:
      error(
        'Invalid element to get info (project, wallet, contract, nft, token)'
      );
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
      Actions.updateProject(nconf);
      break;
    case 'projectLimits':
      Actions.updateLimits(nconf);
      break;
    case 'contract':
      Actions.updateContractDB(nconf);
      break;
    case 'minter':
      Actions.updateContract(nconf, 'minter');
      break;
    case 'owner':
      Actions.updateContract(nconf, 'owner');
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
        'Invalid element to update (nft, minter, owner, verifier, drop, dropstrategy, dropcode)'
      );
      break;
  }
};

const mint = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'nft':
      Actions.mintNFT(nconf);
      break;
    case 'token':
      Actions.mintToken(nconf);
      break;
    default:
      error('Invalid element to mint (nft, token)');
      break;
  }
};

const transfer = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'nft':
      Actions.transferNFT(nconf);
      break;
    case 'token':
      Actions.transferToken(nconf);
      break;
    default:
      error('Invalid element to transfer (nft, token)');
      break;
  }
};

const upload = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'media':
      Actions.uploadMedia(nconf);
      break;
    default:
      error('Invalid element to list (media)');
      break;
  }
};

const deploy = async (nconf) => {
  const element = process.argv[3];
  switch (element) {
    case 'wallet':
      Actions.deployWallet(nconf);
      break;
    case 'contract':
      Actions.deployContract(nconf);
      break;
    case 'drop':
      Actions.deployDrop(nconf);
      break;
    default:
      error('Invalid element to list (contract, nft)');
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
      if (process.argv[3] && process.argv[3] === 'drops') {
        Test.drops(nconf);
      } else if (process.argv[3] && process.argv[3] === 'wallets') {
        Test.wallets(nconf);
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
      mint(nconf);
      break;
    case 'transfer':
      transfer(nconf);
      break;
    case 'test':
      break;
    case 'upload':
      upload(nconf);
      break;
    case 'deploy':
      deploy(nconf);
      break;
    default:
      Actions.info(nconf);
      action !== false && error('Invalid action');
      break;
  }
};

main();
