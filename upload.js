require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs/promises');
const chalk = require('chalk');
const log = console.log;

const main = async () => {
  log(chalk.blue('Upload metadata for a new NFT'));
  const form = new FormData();
  const image = await fs.readFile('./image.png');
  form.append('nftImage', image, 'image.png');
  const config = {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.APIKEY}` },
  };

  axios.post(`${process.env.API}nfts/upload`, form, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
