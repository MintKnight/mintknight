const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const MintKnightBase = require('./base');

class MintKnight extends MintKnightBase {
  constructor(api, props = {}) {
    super(api, props);
  }

  /*
   * Add a user.
   *
   * @param {string} email Email
   * @param {string} password Password
   * @param {string} telephone Phone Number
   * @return {object} User object
   */
  registerUser(email, password) {
    return new Promise((resolve) => {
      this.apiCall(
        'POST',
        'users/v2/register',
        { email, password },
        false
      ).then((res) => {
        this.token = res.token;
        resolve(res);
      });
    });
  }

  /*
   * Login.
   *
   * @param {string} email Email
   * @param {string} password Password
   */
  loginUser(email, password) {
    return new Promise((resolve) => {
      this.apiCall('POST', 'users/v2/login', { email, password }, false).then(
        (res) => {
          this.token = res.token;
          resolve(res);
        }
      );
    });
  }

  /*
   * Set Company information.
   *
   * @param {string} email Email
   * @param {string} password Password
   */
  setCompany(name) {
    return this.apiCall('POST', 'companies/v2', { name }, 'userAuth');
  }

  /*
   * Add Project.
   *
   * @param {string} name Project Name
   * @param {string} description Description
   * @param {string} network Netowrk (mimbai, polygon, testnet)
   */

  addProject(name, network, thumbnail, thumbName) {
    return new Promise((resolve) => {
      const project = {
        name,
        network,
      };

      const form = new FormData();
      for (var key in project) {
        form.append(key, project[key]);
      }
      if (!thumbnail) {
      } else {
        const image = fs.readFileSync(thumbnail);
        form.append('thumb', image, thumbName);
      }
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.token}`,
        },
      };
      const method = 'POST';
      const call = 'projects/v2';
      axios
        .post(`${this.api}${call}`, form, config)
        .then((res) => {
          if (this.responseType === 'basic') resolve(res.data);
          else resolve({ success: true, data: res.data, error: null });
        })
        .catch((e) => {
          this.mkError(`${method} ${call} => ${e.message}`);
          if (this.responseType === 'basic') resolve(false);
          else
            resolve({
              success: false,
              data: null,
              error: e.message,
              code: 0,
              retry: false,
            });
        });
    });
  }

  /*
   * Add Project.
   *
   * @param {string} name Project Name
   * @param {string} description Description
   * @param {string} network Netowrk (mimbai, polygon, testnet)
   */

  UpdateProject(projectId, name, network, thumbnail, thumbName) {
    return new Promise((resolve) => {
      const project = {
        name,
        network,
      };
      const form = new FormData();
      for (var key in project) {
        form.append(key, project[key]);
      }
      if (!thumbnail) {
      } else {
        const image = fs.readFileSync(thumbnail);
        form.append('thumb', image, thumbName);
      }
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.token}`,
        },
      };
      const method = 'POST';
      const call = 'projects/v2';
      axios
        .put(`${this.api}${call}/${projectId}`, form, config)
        .then((res) => {
          if (this.responseType === 'basic') resolve(res.data);
          else resolve({ success: true, data: res.data, error: null });
        })
        .catch((e) => {
          this.mkError(`${method} ${call} => ${e.message}`);
          if (this.responseType === 'basic') resolve(false);
          else
            resolve({
              success: false,
              data: null,
              error: e.message,
              code: 0,
              retry: false,
            });
        });
    });
  }

  /*
   * Get Project.
   */
  getProject() {
    return this.apiCall('GET', 'projects/v2', {}, 'userAuth');
  }

  /*
   * Get Project.
   *
   * @param {string} projectId ProjectId
   */
  updateLimits(projectId) {
    return this.apiCall('PUT', 'projects/v2/limits', { projectId }, 'userAuth');
  }

  /*
   * Get an API KEY for the project.
   *
   * @param {string} projectId ProjectId
   */
  getApiKey(projectId) {
    return new Promise((resolve) => {
      this.apiCall(
        'GET',
        `projects/v2/apikey/${projectId}`,
        {},
        'userAuth'
      ).then((res) => {
        this.apiKey = res.token;
        resolve(res);
      });
    });
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
          `tasks/v2/${taskId}`,
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
   * Add a Contract as draft
   */
  addContract(
    name,
    symbol,
    contractType,
    walletId,
    urlCode = '',
    baseUri = '',
    thumbnail = null,
    thumbName = null
  ) {
    return new Promise((resolve) => {
      const contract = {
        name,
        symbol,
        contractType,
        walletId,
        urlCode,
        baseUri,
        minter: walletId,
        owner: walletId,
      };
      const form = new FormData();
      for (var key in contract) {
        form.append(key, contract[key]);
      }
      if (!!thumbnail) {
        const image = fs.readFileSync(thumbnail);
        form.append('thumb', image, thumbName);
      }
      const config = {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };
      const method = 'POST';
      const call = 'contracts/v2';
      axios
        .post(`${this.api}${call}`, form, config)
        .then((res) => {
          this.mkLog(`${method} ${call} => Success`);
          if (this.responseType === 'basic') resolve(res.data);
          else resolve({ success: true, data: res.data, error: null });
        })
        .catch((e) => {
          this.mkError(`${method} ${call} => ${e.message}`);
          if (this.responseType === 'basic') resolve(false);
          else
            resolve({
              success: false,
              data: null,
              error: e.message,
              code: 0,
              retry: false,
            });
        });
    });
  }

  /*
   * Deploys a Contract (existing in draft)
   *
   * @param {string} contractId
   */
  deployContract(contractId) {
    return this.apiCall(
      'POST',
      `contracts/v2/deploy/${contractId}`,
      {},
      'tokenAuth'
    );
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
      'tokens/v2',
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
      `tokens/v2/${contractId}/${address}`,
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
      'tokens/v2',
      { contractId, walletId, skey, value, to, address },
      'tokenAuth'
    );
  }

  /*
   * Add/upload NFT
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
      const method = 'POST';
      const call = `nfts/v2/${contractId}`;
      return axios
        .post(`${this.api}${call}`, form, config)
        .then((res) => {
          this.mkLog(`${method} ${call} => Success`);
          if (this.responseType === 'basic') resolve(res.data);
          else resolve({ success: true, data: res.data, error: null });
        })
        .catch((e) => {
          this.mkError(`${method} ${call} => ${e.message}`);
          if (this.responseType === 'basic') resolve(false);
          else
            resolve({
              success: false,
              data: null,
              error: e.message,
              code: 0,
              retry: false,
            });
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
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      };
      const method = 'POST';
      const call = `nfts/v2/upload/${contractId}`;
      return axios
        .post(`${this.api}${call}`, form, config)
        .then((res) => {
          this.mkLog(`${method} ${call} => Success`);
          if (this.responseType === 'basic') resolve(res.data);
          else resolve({ success: true, data: res.data, error: null });
        })
        .catch((e) => {
          this.mkError(`${method} ${call} => ${e.message}`);
          if (this.responseType === 'basic') resolve(false);
          else
            resolve({
              success: false,
              data: null,
              error: e.message,
              code: 0,
              retry: false,
            });
        });
    });
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
      'nfts/v2/mint',
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
      `nfts/v2/${contractId}/${tokenId}`,
      { metadata },
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
      `nfts/v2/${nftId}`,
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
    return this.apiCall('GET', `contracts/v2/${contractId}`, {}, 'tokenAuth');
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
      `contracts/v2/${contractId}`,
      { change, walletId, address, owner, skey },
      'tokenAuth'
    );
  }

  /*
   * Update Contract in DB
   */
  updateContractDB(contractId, data) {
    return this.apiCall('PUT', `contracts/v2/${contractId}`, data, 'tokenAuth');
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
      `contracts/v2/${contractId}/prices`,
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
      `contracts/v2/${contractId}/verifier`,
      { walletId, walletId, owner, skey },
      'tokenAuth'
    );
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
      'wallets/v2',
      { refUser, walletType },
      'tokenAuth'
    );
  }

  /*
   * Deploy wallet
   *
   * @param {string} walletId
   */
  deployWallet(walletId) {
    return this.apiCall(
      'POST',
      `wallets/v2/deploy/${walletId}`,
      {},
      'tokenAuth'
    );
  }

  /*
   * Add & Deploy several wallets at the same time
   *
   * @param {integer} numberOfWallets - Number of wallet to create and deploy
   * @param {string} userRef - UserRef
   * @param {string} walletType - Type of wallet (onchain, eoa, signer)
   */
  addAndDeployWallets(numberOfWallets, refUser, walletType) {
    return this.apiCall(
      'POST',
      `wallets/v2/addAndDeployWallets/${numberOfWallets}`,
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
    console.log(walletId);
    return this.apiCall('GET', `wallets/v2/${walletId}`, {}, 'tokenAuth');
  }

  /*
   * Add a new Drop
   */
  addDrop(contractId, data) {
    return this.apiCall(
      'POST',
      `drops/v2/contract/${contractId}`,
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
      `drops/v2/contract/${contractId}`,
      {},
      'tokenAuth'
    );
  }

  /*
   * Update Drop
   */
  updateDrop(dropId, data) {
    return this.apiCall('PUT', `drops/v2/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Get NFT from drop
   */
  getNftFromDrop(dropId, data) {
    return this.apiCall('POST', `drops/v2/getNft/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Mint NFT from drop
   */
  mintNftFromDrop(dropId, nftId, data) {
    return this.apiCall(
      'POST',
      `drops/v2/mintNft/${dropId}/${nftId}`,
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
      `dropStrategies/v2/${dropId}`,
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
      `dropStrategies/v2/drop/${dropId}`,
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
      `dropStrategies/v2/${dropStrategyId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Add a new Drop code by drop
   */
  addDropCode(dropId, data) {
    return this.apiCall('POST', `dropCodes/v2/${dropId}`, data, 'tokenAuth');
  }

  /*
   * Get Drop codes list
   */
  getDropCodes(dropId) {
    return this.apiCall('GET', `dropCodes/v2/drop/${dropId}`, {}, 'tokenAuth');
  }

  /*
   * Update Drop code
   */
  updateDropCode(dropCodeId, data) {
    return this.apiCall(
      'PUT',
      `dropCodes/v2/${dropCodeId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Upload bulk Drop codes
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
      const method = 'POST';
      const call = `dropCodes/v2/upload/${dropId}`;
      return axios
        .post(`${this.api}${call}`, form, config)
        .then((res) => {
          this.mkLog(`${method} ${call} => Success`);
          if (this.responseType === 'basic') resolve(res.data);
          else resolve({ success: true, data: res.data, error: null });
        })
        .catch((e) => {
          this.mkError(`${method} ${call} => ${e.message}`);
          if (this.responseType === 'basic') resolve(false);
          else
            resolve({
              success: false,
              data: null,
              error: e.message,
              code: 0,
              retry: false,
            });
        });
    });
  }

  /*
   * Add a new Drop user
   */
  addDropUser(dropId, data) {
    return this.apiCall(
      'POST',
      `dropUsers/v2/drop/${dropId}`,
      data,
      'tokenAuth'
    );
  }

  /*
   * Get Drop user list by contract
   */
  getDropUsers(dropId) {
    return this.apiCall('GET', `dropUsers/v2/drop/${dropId}`, {}, 'tokenAuth');
  }

  addTestMedia() {
    return this.apiCall('POST', 'media/v2/test', {}, 'tokenAuth');
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
      const method = 'POST';
      const call = `media/v2`;
      axios
        .post(`${this.api}${call}`, form, config)
        .then((res) => {
          this.mkLog(`${method} ${call} => Success`);
          if (this.responseType === 'basic') resolve(res.data);
          else resolve({ success: true, data: res.data, error: null });
        })
        .catch((e) => {
          this.mkError(`${method} ${call} => ${e.message}`);
          if (this.responseType === 'basic') resolve(false);
          else
            resolve({
              success: false,
              data: null,
              error: e.message,
              code: 0,
              retry: false,
            });
        });
    });
  }

  /*
   * Get Media list
   */
  getMedia() {
    return this.apiCall('GET', 'media/v2', {}, 'tokenAuth');
  }

  /*
   * Get NFT list
   */
  getNfts(contractId) {
    return this.apiCall('GET', `nfts/v2/${contractId}`, {}, 'tokenAuth');
  }

  /*
   * Get NFT list by wallet
   */
  getNftsByWallet(walletId) {
    return this.apiCall(
      'GET',
      `nfts/v2/all/wallet/${walletId}`,
      {},
      'tokenAuth'
    );
  }

  /*
   * Get all NFT (from network) by address
   */
  getAllNFTsFromBlockchain(address, params = {}) {
    let url = `nfts/v2/blockchain/${address}`;
    var queryString = Object.keys(params)
      .map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
      })
      .join('&');
    if (!!queryString) {
      url += '?' + queryString;
    }
    return this.apiCall('GET', url, {}, 'tokenAuth');
  }

  /*
   * Get NFT metadata
   */
  getNft(contractId, tokenId) {
    return this.apiCall(
      'GET',
      `nfts/v2/${contractId}/${tokenId}`,
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
      'wallets/v2/sign',
      { contractId, tokens, buyer, walletId, skey },
      'tokenAuth'
    );
  }
}

module.exports = MintKnight;
