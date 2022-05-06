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
   * Wait for a Task to end.
   *
   * @param {string} taskId task ID
   * @param {integer} times It will try every 5 seconds for n times.
   */
  waitTask(taskId, times = 20) {
    if (!taskId) return { addressTo: false };
    return new Promise(async (resolve) => {
      this.mkLog('waiting for Task to end...');
      for (let i = 0; i < times; i += 1) {
        const result = await this.apiCall(
          'GET',
          `tasks/${taskId}`,
          {},
          'tokenAuth'
        );
        if (result.state === 'running' || result.state === 'queued') {
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          this.mkLog('Task ended');
          return resolve(result);
        }
      }
    });
  }

  /*
   * Add a ERC20 Contract
   *
   * @param {string} projectId ProjectId
   */
  addContract(
    name,
    symbol,
    contractType,
    walletId,
    contractId,
    mediaId,
    urlCode
  ) {
    const contract = {
      contractType,
      name,
      symbol,
      minter: walletId,
      owner: walletId,
      contractId,
      mediaId,
      urlCode,
    };
    return this.apiCall('POST', 'contracts/', contract, 'tokenAuth');
  }

  /*
   * Mint tokens
   *
   * @param {string} contractId Contract ID
   * @param {string} walletId Minter Wallet ID
   * @param {string} skey Minter Wallet SKEY
   * @param {number} value Tokens to mint
   * @param {string} to Wallet ID receiving the tokens
   * @param {string} address Alternative address
   */
  mintToken(contractId, walletId, skey, value, to = false, address = false) {
    return this.apiCall(
      'POST',
      'tokens',
      { contractId, walletId, skey, value, to, address },
      'tokenAuth'
    );
  }

  /*
   * Get token info
   */
  getToken(contractId, address) {
    return this.apiCall(
      'GET',
      `tokens/${contractId}/${address}`,
      {},
      'tokenAuth'
    );
  }

  /*
   * Transfer tokens
   *
   * @param {string} contractId Contract ID
   * @param {string} walletId Owner Wallet ID
   * @param {string} skey Owner Wallet SKEY
   * @param {number} value Tokens to transfer.
   * @param {string} to Wallet ID receiving the tokens
   * @param {string} address Alternative address
   */
  transferToken(
    contractId,
    walletId,
    skey,
    value,
    to = false,
    address = false
  ) {
    return this.apiCall(
      'PUT',
      'tokens',
      { contractId, walletId, skey, value, to, address },
      'tokenAuth'
    );
  }

  /*
   * Save NFT
   *
   * @param {string} contractId Contract Id
   * @param {object} metadata NFT minted.
   */
  saveNFT(contractId, metadata, tokenId = 0) {
    return this.apiCall(
      'POST',
      'nfts/save',
      { contractId, metadata, tokenId },
      'tokenAuth'
    );
  }

  /*
   * Mint an NFT
   *
   * @param {string} nftId NFT ID
   * @param {string} walletId Minter Wallet ID
   * @param {string} skey Minter Wallet SKEY
   * @param {string} to Wallet ID receiving the tokens
   * @param {string} address Alternative address
   */
  mintNFT(nftId, walletId, skey, to = false, address = false) {
    return this.apiCall(
      'POST',
      'nfts/mint',
      { nftId, walletId, skey, to, address },
      'tokenAuth'
    );
  }

  /*
   * Update an NFT
   *
   * @param {string} contractId Contract ID
   * @param {string} tokenId Token ID
   * @param {object} metadata NFT minted.
   */
  updateNFT(contractId, tokenId, metadata) {
    return this.apiCall(
      'PUT',
      `nfts/${contractId}/${tokenId}`,
      { metadata },
      'tokenAuth'
    );
  }

  /*
   * Upload NFT
   *
   * @param {string} contractId: Contract ID
   * @param {object} nft (tokenId, name, description, price, coin, attributes)
   *    - attributes is an array (ex: ["hello", "bye", {"key": "value"} ])
   * @param {string} imgFilename: Filename path or filename image
   * @param {buffer} imgBuffer: Image buffer
   */
  uploadNFT(contractId, nft, imgFilename, imgBuffer = null) {
    return new Promise((resolve) => {
      const form = new FormData();
      if (imgBuffer === null) {
        imgBuffer = fs.readFileSync(imgFilename);
      }
      form.append('files', imgBuffer, imgFilename);
      form.append('nft', JSON.stringify(nft));
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      return axios
        .post(`${this.api}nfts/upload_one/${contractId}`, form, config)
        .then((res) => {
          resolve(res.data);
        })
        .catch((e) => log(chalk.red('Error'), e.message));
    });
  }

  /*
   * Upload bulk NFTs
   *
   * @param {string} contractId Contract ID
   * @param {string} csvFilename CSV File name with path
   * @param {string} zipFilename ZIP File name with path
   */
  uploadBulkNFTs(contractId, csvFilename, zipFilename) {
    return new Promise((resolve) => {
      const form = new FormData();
      const csvFile = fs.readFileSync(csvFilename);
      const zipFile = fs.readFileSync(zipFilename);
      form.append('files', csvFile, csvFilename);
      form.append('files', zipFile, zipFilename);
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      return axios
        .post(`${this.api}nfts/upload/${contractId}`, form, config)
        .then((res) => {
          resolve(res.data);
        })
        .catch((e) => log(chalk.red('Error'), e.message));
    });
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
  transferNFT(nftId, walletId, skey, to, address) {
    return this.apiCall(
      'PUT',
      `nfts/${nftId}`,
      { nftId, walletId, skey, to, address },
      'tokenAuth'
    );
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
   * Update owner/minter of the contract
   * @param {string} contractId Contract ID
   * @param {string} change Role to be updated: mintre/owner
   * @param {string} walletId Wallet ID
   * @param {string} address optional address if no walletId
   */
  updateContract(contractId, change, walletId, address, owner, skey) {
    return this.apiCall(
      'PUT',
      `contracts/${contractId}`,
      { change, walletId, address, owner, skey },
      'tokenAuth'
    );
  }

  /*
   * Update Contract in DB
   */
  updateContractDB(contractId, data) {
    return this.apiCall('PUT', `contracts/${contractId}`, data, 'tokenAuth');
  }

  /*
   * Update prices the BUY contract
   * @param {string} contractId Contract ID
   * @param {string} prices comma separated list of prices
   * @param {string} walletId Wallet ID
   * @param {string} address optional address if no walletId
   */
  updatePrices(contractId, prices, owner, skey) {
    return this.apiCall(
      'PUT',
      `contracts/${contractId}/prices`,
      { prices, owner, skey },
      'tokenAuth'
    );
  }

  /*
   * Update Verifier of the BUY Contract.
   * @param {string} contractId Contract ID
   * @param {string} verifier Address of the verifier.
   * @param {string} walletId Wallet ID
   * @param {string} address optional address if no walletId
   */
  updateVerifier(contractId, walletId, owner, skey) {
    return this.apiCall(
      'PUT',
      `contracts/${contractId}/verifier`,
      { walletId, walletId, owner, skey },
      'tokenAuth'
    );
  }

  /*
   * Get Contract Info
   */
  getContract(contractId) {
    return this.apiCall('GET', `contracts/${contractId}`, {}, 'tokenAuth');
  }

  /*
   * Add a wallet
   *
   * @param {string} userRef UserRef
   * @param {string} walletType Type of wallet (onchain, eoa, signer)
   */
  addWallet(refUser, walletType) {
    return this.apiCall(
      'POST',
      'wallets',
      { refUser, walletType },
      'tokenAuth'
    );
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
  addDrop(contractId, data) {
    return this.apiCall(
      'POST',
      `drops/contract/${contractId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Get Drop list by contract
   */
  getDrops(contractId) {
    return this.apiCall('GET', `drops/contract/${contractId}`, {}, 'tokenAuth');
  }

  /*
   * Update Drop
   */
  updateDrop(dropId, data) {
    return this.apiCall('PUT', `drops/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Mint NFT from drop
   */
  mintNftFromDrop(dropId, data) {
    return this.apiCall('POST', `drops/mintNft/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Add a new Drop strategy
   */
  addDropStrategy(dropId, data) {
    return this.apiCall('POST', `drop_strategies/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Get Drop strategies list by drop
   */
  getDropStrategies(dropId) {
    return this.apiCall(
      'GET',
      `drop_strategies/drop/${dropId}`,
      {},
      'tokenAuth'
    );
  }

  /*
   * Update Drop strategy
   */
  updateDropStrategy(dropStrategyId, data) {
    return this.apiCall(
      'PUT',
      `drop_strategies/${dropStrategyId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Add a new Drop code by drop
   */
  addDropCode(dropId, data) {
    return this.apiCall('POST', `drop_codes/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Get Drop codes list
   */
  getDropCodes(dropId) {
    return this.apiCall('GET', `drop_codes/drop/${dropId}`, {}, 'tokenAuth');
  }

  /*
   * Update Drop code
   */
  updateDropCode(dropCodeId, data) {
    return this.apiCall('PUT', `drop_codes/${dropCodeId}`, data, 'tokenAuth');
  }

  /*
   * Upload bulk NFTs
   *
   * @param {string} dropId Drop ID
   * @param {string} csvFilename CSV File name with path
   */
  uploadBulkDropCodes(dropId, csvFilename) {
    return new Promise((resolve) => {
      const form = new FormData();
      const csvFile = fs.readFileSync(csvFilename);
      form.append('file', csvFile, csvFilename);
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      return axios
        .post(`${this.api}drop_codes/upload/${dropId}`, form, config)
        .then((res) => {
          resolve(res.data);
        })
        .catch((e) => log(chalk.red('Error'), e.message));
    });
  }

  /*
   * Add a new Drop user
   */
  addDropUser(dropId, data) {
    return this.apiCall('POST', `drop_users/drop/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Get Drop user list by contract
   */
  getDropUsers(dropId) {
    return this.apiCall('GET', `drop_users/drop/${dropId}`, {}, 'tokenAuth');
  }

  addTestMedia() {
    return this.apiCall('POST', 'media/test', {}, 'tokenAuth');
  }

  /*
   * Upload One Image to Arweave.
   *
   * @param {string} file File name with path
   */
  addMedia(imageFile, imageName) {
    return new Promise((resolve) => {
      const form = new FormData();
      const image = fs.readFileSync(imageFile);
      form.append('nftImage', image, imageName);
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      axios
        .post(`${this.api}media`, form, config)
        .then((res) => {
          resolve(res.data);
        })
        .catch((e) => log(chalk.red('Error'), e.message));
    });
  }

  /*
   * Get Media list
   */
  getMedia() {
    return this.apiCall('GET', 'media', {}, 'tokenAuth');
  }

  /*
   * Get NFT list
   */
  getNfts(contractId) {
    return this.apiCall('GET', `nfts/${contractId}`, {}, 'tokenAuth');
  }

  /*
   * Get NFT list by wallet
   */
  getNftsByWallet(walletId) {
    return this.apiCall('GET', `nfts/all/wallet/${walletId}`, {}, 'tokenAuth');
  }

  /*
   * Get NFT metadata
   */
  getNft(contractId, tokenId) {
    return this.apiCall(
      'GET',
      `nfts/${contractId}/${tokenId}`,
      {},
      'tokenAuth'
    );
  }

  /*
   * Get NFT metadata
   */
  getSignature(contractId, tokens, buyer, walletId, skey) {
    return this.apiCall(
      'POST',
      'wallets/sign',
      { contractId, tokens, buyer, walletId, skey },
      'tokenAuth'
    );
  }
}

module.exports = MintKnight;
