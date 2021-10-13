require('dotenv').config();
const fs = require('fs')
const path = require('path')
const FormData = require('form-data');
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
/*
  // 1. Add the NFT contract to the project.
  let task = await mintknight.deployContract(
     project.nftId,
     minter.walletId,
  );
  task = await mintknight.waitTask(task.taskId);
  project.nftAaddress = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'nft.json'), JSON.stringify(project), 'utf8');
  */
  // 2. Mint 1 NFT to wallet 1.
  task = await mintknight.uploadNFT(
    project.nftId,
    'NFT #2',
    'First NFT to be created on Mintknight',
    [{
        trait_type: "XP",
        value: "100"
      }, {
        trait_type: "Color",
        value: "blue"
    }],
    './assets/image.png'
  );
  task = await mintknight.waitTask(task.taskId);
/*
  const erc721 = await mintknight.getContract(project.nftId);
  console.log(erc721);
  let wallet = await mintknight.getWallet(wallet1.walletId);
  console.log(wallet);

  // 3. Transfer NFT to Wallet2.
  task = await mintknight.transferNFT(project.nftId, wallet1.walletId, wallet1.skey, wallet2.walletId, 1);
  task = await mintknight.waitTask(task.taskId);

  wallet = await mintknight.getWallet(wallet2.walletId);
  console.log(wallet);
  */
};

main();
