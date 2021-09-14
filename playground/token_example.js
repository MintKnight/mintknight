require('dotenv').config();
const fs = require('fs')
const path = require('path')
const MintKnight = require('../src/index')
// const MintKnight = require('mintknight')
let project, minter, wallet1, wallet2

try {
  project = require('./json/project.json');
  minter = require('./json/minter.json');
  wallet1 = require('./json/wallet1.json');
  wallet2 = require('./json/wallet2.json');
} catch (e) {
  console.log(e);
  console.log('Environment not ready. Be sure to read README.md and rund the setup script first');
}


const main = async () => {
  const mintknight = new MintKnight(process.env.MINTKNIGHT_API, {debug: true, ...project});

  // 1. Add the contract to the project ERC20.
  let task = await mintknight.writeTokenContract(
     process.env.TOKEN_NAME,
     process.env.TOKEN_DESCRIPTION,
     process.env.TOKEN_SYMBOL,
     project.campaignId,
     minter.walletId,
     100000,
     2
  );
  const token = {contractId: task.contract._id};
  task = await mintknight.waitTask(task.taskId);
  token.address = task.addressTo;

  // Save INFO.
  fs.writeFileSync( path.join(__dirname, 'json', 'erc20.json'), JSON.stringify(token), 'utf8');

  // 2. Mint 50 tokens to wallet 1.
  task = await mintknight.mintToken(
    token.contractId,
    minter.walletId,
    minter.skey,
	wallet1.walletId,
	100,
  );
  task = await mintknight.waitTask(task.taskId);
  
  // 3. Transfer 10 tokens to Wallet2.
  task = await mintknight.transferToken(token.contractId, wallet1.walletId, wallet1.skey, wallet2.walletId, 10);
  task = await mintknight.waitTask(task.taskId);

  // 4. Transfer 10 tokens to one address
  task = await mintknight.transferToken(token.contractId, wallet1.walletId, wallet1.skey, process.env.MINTKNIGHT_ADDR, 10);
  await mintknight.waitTask(task.taskId);

  // 5. Check Balance for Both wallets
  let wallet = await mintknight.getWallet(wallet1.walletId);
  console.log(wallet);
  wallet = await mintknight.getWallet(wallet2.walletId);
  console.log(wallet);

};

main();
