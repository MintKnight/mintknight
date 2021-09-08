require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs/promises');
const chalk = require('chalk');
const log = console.log;

const nfts = {
  contractId: process.env.CONTRACTID,
  walletId: process.env.MINTERID,
  skey: process.env.MINTERKEY,
  nft:
    {
      walletId: process.env.WALLET1ID,
      metadata: {
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
    },
};


const main = async () => {
  log(chalk.blue('Mint new NFT'));
  const config = { headers: { Authorization: `Bearer ${process.env.APIKEY}` } };

  axios.post(`${process.env.API}nfts/mint`, nfts, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
