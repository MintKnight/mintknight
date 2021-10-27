require('dotenv').config();
const fs = require('fs')
const path = require('path')
const { MintKnight } = require('../src/index')
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
  const mintknight = new MintKnight(process.env.MINTKNIGHT_API_SERVICE, {debug: true, ...project});

  // 1. Add the contract to the project ERC20.
  let task = await mintknight.deployContract(
     project.tokenId,
     minter.walletId,
  );
  task = await mintknight.waitTask(task.taskId);
  project.tokenAddress = task.addressTo;

  // Save INFO.
  fs.writeFileSync( path.join(__dirname, 'json', 'project.json'), JSON.stringify(project),'utf8');

  // 2. Mint 50 tokens to wallet 1.
  task = await mintknight.mintToken(
    project.tokenId,
    minter.walletId,
    minter.skey,
	wallet1.walletId,
	'50',
  );
  task = await mintknight.waitTask(task.taskId);

  // 3. Transfer 10 tokens to Wallet2.
  task = await mintknight.transferToken(
    project.tokenId,
    wallet1.walletId,
    wallet1.skey,
    wallet2.walletId,
    '10');
  task = await mintknight.waitTask(task.taskId);

  // 4. Transfer 10 tokens to one address
  task = await mintknight.transferToken(project.tokenId, wallet1.walletId, wallet1.skey, process.env.MINTKNIGHT_ADDR, '10');
  await mintknight.waitTask(task.taskId);

  // 5. Transfer from a contract address (not a contractId)
  task = await mintknight.transferToken(project.tokenAddress, wallet1.walletId, wallet1.skey, process.env.MINTKNIGHT_ADDR, 5);
  await mintknight.waitTask(task.taskId);

  // 6. Check Balance for Both wallets
  let wallet = await mintknight.getWallet(wallet1.walletId);
  console.log(wallet);
  wallet = await mintknight.getWallet(wallet2.walletId);
  console.log(wallet);

};

main();
