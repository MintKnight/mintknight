require('dotenv').config();
const fs = require('fs')
const path = require('path')
const MintKnight = require('../src/index')
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

// const MintKnight = require('mintknight')

const main = async () => {
  const mintknight = new MintKnight(process.env.MINTKNIGHT_API, {debug: true, ...project});
  // 1. Add the NFT contract to the project.
  /*
  let task = await mintknight.writeNFTContract(
     process.env.TOKEN_NAME,
     process.env.TOKEN_DESCRIPTION,
     process.env.TOKEN_SYMBOL,
     project.campaignId,
     minter.walletId,
     100000,
     2
  );
  const nft = {contractId: task.contract._id};
  task = await mintknight.waitTask(task.taskId);
  nft.address = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'nft.json'), JSON.stringify(nft), 'utf8');*/
  const nft = require('./json/nft.json');

  // 2. Mint 1 NFT to wallet 1.
  /*
  task = await mintknight.mintNFT(
    nft.contractId,
    minter.walletId,
    minter.skey,
	wallet1.walletId,
	{
      name: 'NFT #1',
      description: "First NFT to be created on Mintknight",
      external_url: "https://company.org/test/1",
      image: 'https://sandbox.mintknight.com/img/nft2.png',
      attributes: [{
        trait_type: "XP",
        value: "100"
      }, {
        trait_type: "Color",
        value: "blue"
      }]
    },
  );
  task = await mintknight.waitTask(task.taskId);
  */

  // const erc20 = await mintknight.getToken(token.contractId);
  // console.log(erc20);
  // let wallet = await mintknight.getWallet(wallet1.walletId);
  // console.log(wallet);

  // 3. Transfer 10 tokens to Wallet2.
  task = await mintknight.transferToken(nft.contractId, wallet1.walletId, wallet1.skey, wallet2.walletId, 1);
  task = await mintknight.waitTask(task.taskId);

  // 4. Transfer 100 tokens back to Wallet1

  // 5. Send tokens to an external address (No Wallet).

  // 5. Check Balance for Both wallets
  // Save token Info (JSON)
};

main();
