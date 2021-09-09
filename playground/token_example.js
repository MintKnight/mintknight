require('dotenv').config();
const fs = require('fs')
const path = require('path')
const MintKnight = require('../src/index')
let project, minter, wallet1, wallet2

try {
  project = require('./json/project.json');
  minter = require('./json/minter.json');
  wallet1= require('./json/wallet1.json');
  wallet2 = require('./json/wallet2.json');
} catch (e) {
  console.log(e);
  console.log('Environment not ready. Be sure to read README.md and rund the setup script first');
}

// const MintKnight = require('mintknight')

const main = async () => {
  const mintknight = new MintKnight(process.env.MINTKNIGHT_API, {debug: true, ...project});

  // 1. Add the contract to the project ERC20.
  let task = await mintknight.writeTokenContract(
     process.env.TOKEN_NAME,
     process.env.TOKEN_DESCRIPTION,
     process.env.TOKEN_SYMBOL,
     project.campaignId,
     minter.walletId
  );
  const token = {contractId: task.contract._id};
  task = await mintknight.waitTask(task.taskId);
  token.address = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'erc20.json'), JSON.stringify(token), 'utf8');


  // 2. Mint 500 tokens to wallet 1.


  // 3. Transfer 100 tokens to Wallet2.

  // 4. Transfer 100 tokens back to Wallet1

  // 5. Send tokens to an external address (No Wallet).

  // 5. Check Balance for Both wallets
  // Save token Info (JSON)
};

main();
