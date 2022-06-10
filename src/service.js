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
  waitTask(taskId, times = 1000) {
    if (!taskId) return { addressTo: false };
    return new Promise(async (resolve) => {
      this.mkLog('waiting for Task to end...');
      for (let i = 0; i < times; i += 1) {
        const result = await this.apiCall(
          'GET',
          `tasks/v1/${taskId}`,
          {},
          'tokenAuth'
        );
        const data = this.responseType === 'basic' ? result : result.data;
        if (
          data.state === 'running' ||
          data.state === 'queued' ||
          data.state === 'iddle'
        ) {
          await new Promise((r) => setTimeout(r, 5000));
        } else {
          this.mkLog('Task ended');
          data.finished = true;
          return resolve(data);
        }
      }
      this.mkLog('Task still pending');
      return resolve({ state: 'failed', finished: false });
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
    urlCode,
    baseUri = null
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
    if (!!baseUri) contract.baseUri = baseUri;
    return this.apiCall('POST', 'contracts/v1/', contract, 'tokenAuth');
  }

  

  /*
   * Save a ERC20 Contract on draft mode v2
   *
   * @param {string} projectId ProjectId
   */
  saveContract(
    name,
    symbol,
    contractType,
    walletId,
    contractId,
    mediaId,
    urlCode,
    thumbnail,
    thumbName
  ) {
    return new Promise((resolve) => {
      const contract = {
        name,
        symbol,
        contractType,
        walletId,
        urlCode,
      };

      const form = new FormData();
      for (var key in contract) {
        form.append(key, contract[key]);
      }
      if (!thumbnail) {
      } else {
        const image = fs.readFileSync(thumbnail);
        form.append('thumb', image, thumbName);
      }

      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };

      axios
        .post(`${this.api}contracts/v2/save`, form, config)
        .then((res) => {
          console.log(res.data);
          resolve(res.data);
        })
        .catch((e) => {
          log(chalk.red('Error'), e.message);
          resolve(false);
        });
    });
  }

  /*
   * Deploys an ERC20 Contract (existing in draft)
   *
   * @param {string} projectId ProjectId
   */
  deployContract(contractId) {
    const dataForm = {
      contractId,
    };
    return this.apiCall('POST', 'contracts/v2/', dataForm, 'tokenAuth');
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
      'tokens/v1',
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
      `tokens/v1/${contractId}/${address}`,
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
      'tokens/v1',
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
      'nfts/v1/save',
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
      'nfts/v1/mint',
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
      `nfts/v1/${contractId}/${tokenId}`,
      { metadata },
      'tokenAuth'
    );
  }

  /*
   * Upload NFT
   *
   * @param {string} contractId: Contract ID
   * @param {object} nft (tokenId, name, description, attributes)
   *    - attributes is an array of objects
   *        ex: [{
   *              "trait_type": "1",
   *              "display_type": "2",
   *              "value": "3",
   *            }]
   * @param {string} imgFilename: Filename path or filename image
   * @param {buffer} imgBuffer: Image buffer
   */
  addNFT(contractId, nft, imgFilename = null, imgBuffer = null) {
    return new Promise((resolve) => {
      const form = new FormData();
      if (!!imgFilename) {
        if (imgBuffer === null) {
          imgBuffer = fs.readFileSync(imgFilename);
        }
        form.append('files', imgBuffer, imgFilename);
      }
      for (var key in nft) {
        form.append(`nft[${key}]`, nft[key]);
      }
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      return axios
        .post(`${this.api}nfts/v2/${contractId}`, form, config)
        .then((res) => {
          resolve(res.data);
        })
        .catch((e) => {
          log(chalk.red('Error'), e.message);
          resolve(false);
        });
    });
  }

  /*
   * Add NFTs at bulk mode
   *
   * @param {string} contractId Contract ID
   * @param {string} csvFilename CSV File name with path
   * @param {string} zipFilename ZIP File name with path
   * @param {string} dropId Drop ID (optional)
   */
  addNFTs(contractId, csvFilename, zipFilename, dropId) {
    return new Promise((resolve) => {
      const form = new FormData();
      const csvFile = fs.readFileSync(csvFilename);
      const zipFile = fs.readFileSync(zipFilename);
      form.append('files', csvFile, csvFilename);
      form.append('files', zipFile, zipFilename);
      if (!!dropId) form.append('dropId', dropId);
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      return axios
        .post(`${this.api}nfts/v1/upload/${contractId}`, form, config)
        .then((res) => {
          resolve(res.data);
        })
        .catch((e) => {
          log(chalk.red('Error'), e.message);
          resolve(false);
        });
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
      `nfts/v1/${nftId}`,
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
    return this.apiCall('GET', `contracts/v1/${contractId}`, {}, 'tokenAuth');
  }

  /*
   * Update owner/minter of the contract
   * @param {string} contractId Contract ID
   * @param {string} change Role to be updated: minter/owner
   * @param {string} walletId Wallet ID
   * @param {string} address optional address if no walletId
   */
  updateContract(contractId, change, walletId, address, owner, skey) {
    return this.apiCall(
      'PUT',
      `contracts/v1/${contractId}`,
      { change, walletId, address, owner, skey },
      'tokenAuth'
    );
  }

  /*
   * Update Contract in DB
   */
  updateContractDB(contractId, data) {
    return this.apiCall('PUT', `contracts/v1/${contractId}`, data, 'tokenAuth');
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
      `contracts/v1/${contractId}/prices`,
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
      `contracts/v1/${contractId}/verifier`,
      { walletId, walletId, owner, skey },
      'tokenAuth'
    );
  }

  /*
   * Get Contract Info
   */
  getContract(contractId) {
    return this.apiCall('GET', `contracts/v1/${contractId}`, {}, 'tokenAuth');
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
      'wallets/v1',
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
    return this.apiCall('GET', `wallets/v1/${walletId}`, {}, 'tokenAuth');
  }

  /*
   * Add a new Drop
   */
  addDrop(contractId, data) {
    return this.apiCall(
      'POST',
      `drops/v1/contract/${contractId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Get Drop list by contract
   */
  getDrops(contractId) {
    return this.apiCall(
      'GET',
      `drops/v1/contract/${contractId}`,
      {},
      'tokenAuth'
    );
  }

  /*
   * Update Drop
   */
  updateDrop(dropId, data) {
    return this.apiCall('PUT', `drops/v1/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Get NFT from drop
   */
  getNftFromDrop(dropId, data) {
    return this.apiCall('POST', `drops/v1/getNft/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Mint NFT from drop
   */
  mintNftFromDrop(dropId, nftId, data) {
    return this.apiCall(
      'POST',
      `drops/v1/mintNft/${dropId}/${nftId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Add a new Drop strategy
   */
  addDropStrategy(dropId, data) {
    return this.apiCall(
      'POST',
      `drop_strategies/v1/${dropId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Get Drop strategies list by drop
   */
  getDropStrategies(dropId) {
    return this.apiCall(
      'GET',
      `drop_strategies/v1/drop/${dropId}`,
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
      `drop_strategies/v1/${dropStrategyId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Add a new Drop code by drop
   */
  addDropCode(dropId, data) {
    return this.apiCall('POST', `drop_codes/v1/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Get Drop codes list
   */
  getDropCodes(dropId) {
    return this.apiCall('GET', `drop_codes/v1/drop/${dropId}`, {}, 'tokenAuth');
  }

  /*
   * Update Drop code
   */
  updateDropCode(dropCodeId, data) {
    return this.apiCall(
      'PUT',
      `drop_codes/v1/${dropCodeId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Upload bulk NFTs
   *
   * @param {string} dropId Drop ID
   * @param {string} csvFilename CSV File name with path
   */
  addDropCodes(dropId, csvFilename) {
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
        .post(`${this.api}drop_codes/v1/upload/${dropId}`, form, config)
        .then((res) => {
          resolve(res.data);
        })
        .catch((e) => {
          log(chalk.red('Error'), e.message);
          resolve(false);
        });
    });
  }

  /*
   * Add a new Drop user
   */
  addDropUser(dropId, data) {
    return this.apiCall(
      'POST',
      `drop_users/v1/drop/${dropId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Get Drop user list by contract
   */
  getDropUsers(dropId) {
    return this.apiCall('GET', `drop_users/v1/drop/${dropId}`, {}, 'tokenAuth');
  }

  addTestMedia() {
    return this.apiCall('POST', 'media/v1/test', {}, 'tokenAuth');
  }

  /*
   * Upload One Image to Arweave.
   */
  addMedia(imageFile, imageName, uploadToArweave = false) {
    return new Promise((resolve) => {
      const form = new FormData();
      const image = fs.readFileSync(imageFile);
      form.append('media', image, imageName);
      if (uploadToArweave) form.append('uploadToArweave', 'true');
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      axios
        .post(`${this.api}media/v2`, form, config)
        .then((res) => {
          resolve(res.data);
        })
        .catch((e) => {
          log(chalk.red('Error'), e.message);
          resolve(false);
        });
    });
  }

  /*
   * Get Media list
   */
  getMedia() {
    return this.apiCall('GET', 'media/v1', {}, 'tokenAuth');
  }

  /*
   * Get NFT list
   */
  getNfts(contractId) {
    return this.apiCall('GET', `nfts/v1/${contractId}`, {}, 'tokenAuth');
  }

  /*
   * Get NFT list by wallet
   */
  getNftsByWallet(walletId) {
    return this.apiCall(
      'GET',
      `nfts/v1/all/wallet/${walletId}`,
      {},
      'tokenAuth'
    );
  }

  /*
   * Get NFT metadata
   */
  getNft(contractId, tokenId) {
    return this.apiCall(
      'GET',
      `nfts/v1/${contractId}/${tokenId}`,
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
      'wallets/v1/sign',
      { contractId, tokens, buyer, walletId, skey },
      'tokenAuth'
    );
  }
}

module.exports = MintKnight;
