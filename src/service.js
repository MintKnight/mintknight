const axios = require('axios');
const chalk = require('chalk');
const FormData = require('form-data');
const fs = require('fs');
const log = console.log;

const MintKnightBase = require('./base');

class MintKnight extends MintKnightBase {

  constructor(api, props = {}) {
    super(api, props);
  }

   /*
   * Add a wallet
   *
   * @param {string} userRef UserRef
   */
  addWallet(userRef) {
    return this.apiCall('POST', 'wallets', { userRef }, 'tokenAuth');
  }

   /*
   * Wait for a Task to end.
   *
   * @param {string} taskId task ID
   * @param {integer} times It will try every 5 seconds for n times.
   */
  waitTask(taskId, times = 20) {
    if (!taskId) return {addressTo: false};
    return new Promise(async (resolve) => {
      this.mkLog('waiting for Task to end...');
      for (let i = 0; i < times; i += 1) {
        const result = await this.apiCall('GET', `tasks/${taskId}`, {}, 'tokenAuth');
		console.log(result);
        if (result.state === 'writing' || result.state === 'queued') {
          await new Promise((r) => setTimeout(r, 5000));
		} else {
          this.mkLog('Task ended');
		  return resolve(result);
		}
	  }
    });
  }

  /*
   * Upload One Image to Arweave.
   *
   * @param {string} file File name with path
   */
  uploadImage(imageFile) {
    return new Promise((resolve) => {
      const form = new FormData();
      const image = fs.readFileSync(imageFile);
      form.append('nftImage', image, 'image.png');
      const config = { headers: { ...form.getHeaders(), Authorization: `Bearer ${this.apiKey}` } };
      axios.post(`${this.api}nfts/upload`, form, config)
      .then((res) => {
        log(res.data);
        resolve(res.data);
      })
      .catch((e) => log(chalk.red('Error'), e.message));
    });
  }

  /*
   * Upload ONE NFT.
   *
   * @param {string} file File name with path
   */
  uploadNFT(contractId, name, description, attributes, imageFile) {
    return new Promise((resolve) => {
      const form = new FormData();
      const image = fs.readFileSync(imageFile);
      form.append('nftImage', image, 'image.png');
      form.append('body', { contractId, name, description, attributes });
      const config = { headers: { ...form.getHeaders(), Authorization: `Bearer ${this.apiKey}` } };
      console.log(`${this.api}nfts/upload`);
      axios.post(`${this.api}nfts/upload`, form, config)
      .then((res) => {
        log(res.data);
        resolve(res.data);
      })
      .catch((e) => log(chalk.red('Error'), e.message));
    });
  }

  /*
   * Add a ERC20 Contract
   *
   * @param {string} projectId ProjectId
   */
  addContract(name, symbol, contractType, walletId ) {
    const contract = {
      contractType,
      name,
      symbol,
      walletId,
    };
    return this.apiCall('POST', `contracts/`, contract, 'tokenAuth');
  }

  /*
   * Mint a token
   *
   * @param {string} contractId Contract ID
   * @param {string} walletId Minter Wallet ID
   * @param {string} skey MInter Wallet SKEY
   * @param {string} to Wallet ID receiving the tokens
   * @param {number} value Tokens minted.
   */
  mintToken(contractId, walletId, skey, to, value) {
    return this.apiCall('POST', 'tokens', { contractId, walletId, skey, to, value }, 'tokenAuth');
  }

  /*
   * Mint an NFT
   *
   * @param {string} contractId Contract ID
   * @param {string} walletId Minter Wallet ID
   * @param {string} skey MInter Wallet SKEY
   * @param {string} to Wallet ID receiving the tokens
   * @param {object} metadata NFT minted.
   */
  mintNFT(contractId, walletId, skey, to, metadata) {
    return this.apiCall('POST', 'nfts', {contractId, walletId, skey, to, metadata}, 'tokenAuth');
  }

  /*
   * Transfer a token
   *
   * @param {string} contractId Contract ID
   * @param {string} walletId From Wallet ID
   * @param {string} skey From Wallet SKEY
   * @param {string} to Wallet ID receiving the tokens
   * @param {number} value Tokens minted.
   */
  transferToken(contractId, walletId, skey, to, value) {
    return this.apiCall('PUT', 'tokens', { contractId, walletId, skey, to, value }, 'tokenAuth');
  }

  /*
   * Transfer one NFT
   *
   * @param {string} contractId Contract ID
   * @param {string} walletId From Wallet ID
   * @param {string} skey From Wallet SKEY
   * @param {string} to Wallet ID receiving the tokens
   * @param {number} tokenId tokenId.
   */
  transferNFT(contractId, walletId, skey, to, tokenId) {
    return this.apiCall('PUT', 'nfts', { contractId, walletId, skey, to, tokenId}, 'tokenAuth');
  }

  /*
   * Get a contract
   *
   * @param {string} contractId contract ID
   */
  getContract(contractId) {
    return this.apiCall('GET', `contracts/${contractId}`, {}, 'tokenAuth');
  }

  /*
   * Get a token
   *
   * @param {string} contractId contract ID
   */
  getNFT(contractId) {
    return this.apiCall('GET', `nfts/${contractId}`, {}, 'tokenAuth');
  }

  /*
   * Get a wallet
   *
   * @param {string} walletId wallet ID
   */
  getWallet(walletId) {
    return this.apiCall('GET', `wallets/${walletId}`, {}, 'tokenAuth');
  }

  /*
   * Add a new Drop
   */
  addDrop(name, dropType, totalNfts, maxNfts, totalYield, price, imgBefore, imgAfter ,contractId, walletId, skey) {
    return this.apiCall('POST', 'drops', {name, dropType, totalNfts, maxNfts, totalYield, price, imgBefore, imgAfter, contractId, walletId, skey}, 'tokenAuth');
  }

  /*
   * Get a Code
   */
  getCode(dropHash) {
    return this.apiCall('POST', 'drops/code', {dropHash}, 'tokenAuth');
  }

  /*
   * Upload One Image to Arweave.
   *
   * @param {string} file File name with path
   */
  addImage(imageFile, imageName) {
    return new Promise((resolve) => {
      const form = new FormData();
      const image = fs.readFileSync(imageFile);
      form.append('nftImage', image, imageName);
      const config = { headers: { ...form.getHeaders(), Authorization: `Bearer ${this.apiKey}` } };
      axios.post(`${this.api}media`, form, config)
      .then((res) => {
        resolve(res.data);
      })
      .catch((e) => log(chalk.red('Error'), e.message));
    });
  }
}

module.exports = MintKnight
