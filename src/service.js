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
  addContract(name, symbol, contractType, walletId, contractId, mediaId) {
    const contract = {
      contractType,
      name,
      symbol,
      minter: walletId,
      owner: walletId,
      contractId,
      mediaId,
    };
    return this.apiCall('POST', 'contracts/', contract, 'tokenAuth');
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
    return this.apiCall(
      'POST',
      'tokens',
      { contractId, walletId, skey, to, value },
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
   * Transfer a token
   *
   * @param {string} contractId Contract ID
   * @param {string} walletId From Wallet ID
   * @param {string} skey From Wallet SKEY
   * @param {string} to Wallet ID receiving the tokens
   * @param {number} value Tokens minted.
   */
  transferToken(contractId, walletId, skey, to, value) {
    return this.apiCall(
      'PUT',
      'tokens',
      { contractId, walletId, skey, to, value },
      'tokenAuth'
    );
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
  addDrop(
    name,
    dropType,
    totalNfts,
    maxNfts,
    totalYield,
    price,
    imgBefore,
    imgAfter,
    contractId,
    walletId,
    skey
  ) {
    return this.apiCall(
      'POST',
      'drops',
      {
        name,
        dropType,
        totalNfts,
        maxNfts,
        totalYield,
        price,
        imgBefore,
        imgAfter,
        contractId,
        walletId,
        skey,
      },
      'tokenAuth'
    );
  }

  /*
   * Get a Code
   */
  getCode(dropHash) {
    return this.apiCall('POST', 'drops/code', { dropHash }, 'tokenAuth');
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
