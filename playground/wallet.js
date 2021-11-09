require('dotenv').config();
const fs = require('fs')
const path = require('path')
const faker = require('faker');

const { MintKnight } = require('../src/index')

try {
  project = require('./json/project.json');
} catch (e) {
  console.log('Environment not ready. Be sure to read README.md and rund the setup script first');
}

const main = async () => {
  const mintknight = new MintKnight(process.env.MINTKNIGHT_API_SERVICE, {debug: true, ...project});

  // Add wallet : minter for the contracts. Th id is internal to your organization.
  let task = await mintknight.addWallet('id_minter');
  const minter = { walletId: task.wallet._id, skey: task.skey1 };
  task = await mintknight.waitTask(task.taskId);
  minter.address = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'minter.json'), JSON.stringify(minter), 'utf8')
/*
  // Add Wallet 1 for the contract.
  task = await mintknight.addWallet('id_user_wallet_1');
  const wallet1 = { walletId: task.wallet._id, skey: task.skey1 };
  task = await mintknight.waitTask(task.taskId);
  wallet1.address = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'wallet1.json'), JSON.stringify(wallet1), 'utf8');

  // Add Wallet 2 for the contract.
  task = await mintknight.addWallet('id_user_wallet_2');
  const wallet2 = { walletId: task.wallet._id, skey: task.skey1 };
  task = await mintknight.waitTask(task.taskId);
  wallet2.address = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'wallet2.json'), JSON.stringify(wallet2), 'utf8');
  */
};

main();
