const axios = require('axios');
const chalk = require('chalk');
const FormData = require('form-data');
const fs = require('fs');
const log = console.log;
const parameters = require('./config/parameters')

module.exports = class MintKnight {

  constructor(api, props = {}) {
    this.api = api;
    this.debug = props.debug || false;
    this.token = props.token || false;
    this.apiKey = props.apiKey || false;
  }

  /*
   * mintknight Log
   */
  mkLog(msg) {
    if (this.debug) log(chalk.blue('Log'), msg);
  }

  /*
   * mintknight Error
   */
  mkError(msg) {
    if (this.debug) log(chalk.red('Error'), msg);
  }

  /*
   * Validate input parameters
   */
  validate(params, auth) {
    return new Promise((resolve, reject) => {
      if (auth == 'userAuth' && this.token === false) {
        reject(new Error(`You are not authorized. Login First.`));
      } else if (auth == 'tokenAuth' && this.apiKey === false) {
          reject(new Error(`You are not authorized. You need the API KEY for the project.`));
	  }

      const keys = Object.keys(params);
      for (let i=0; i<keys.length; i++) {
        // Check special parameters from config.
        if (parameters[keys[i]]) {
          // Check Type
          if (parameters[keys[i]].type && (typeof params[keys[i]] !== parameters[keys[i]].type))
            reject(new Error(`Parameter ${keys[i]} should be a ${parameters[keys[i]].type}`));
          // Check length.
          if (parameters[keys[i]].min && (params[keys[i]].length < parameters[keys[i]].min))
            reject(new Error(`Parameter ${keys[i]} should be at least ${parameters[keys[i]].min} caharcters`));
          // Check Valid values.
          if (parameters[keys[i]].valid && !parameters[keys[i]].valid.includes(params[keys[i]]))
            reject(new Error(`Parameter ${keys[i]} is not valid : ${parameters[keys[i]].valid}`));
        } else if (!params[keys[i]] || params[keys[i]].length < 3) {
		  log(keys, params);
          reject(new Error(`Parameter ${keys[i]} should be at least 5 chars`));
        }
      }
      resolve(params);
    });
  }

  /*
   * Call the API
   *
   * @param {string} method Method : get, post, put, delete
   * @param {object} params Parameters to be used to call.
   */
  apiCall(method, call, params = {}, auth = 'noAuth') {
    return new Promise(resolve => {
      this.validate(params, auth)
       .then((params) => {
		 let config = {}
         if (auth !== 'noAuth') {
           config = (auth === 'userAuth')
             ? { headers: { Authorization: `Bearer ${this.token}` } }
             : { headers: { Authorization: `Bearer ${this.apiKey}` } }
         }
         switch (method) {
           case 'POST':
             return axios.post(`${this.api}${call}`, params, config);
           case 'PUT':
             return axios.put(`${this.api}${call}`, params, config);
           case 'GET':
             return axios.get(`${this.api}${call}`, config);
         }
       })
        .then((res) => {
          const status = res.data.status || false
          if (status === 'Failed') {
            throw(new Error(`${method} ${call} => ${res.data.error}`));
          }
          this.mkLog(`${method} ${call} => Success`);
          resolve(res.data);
       })
       .catch((e) => {
         this.mkError(`${method} ${call} => ${e.message}`);
         resolve(false);
        });
    });
  }

  /*
   * Add a user.
   *
   * @param {string} username New user Name
   * @param {string} email Email
   * @param {string} password Password
   * @param {string} telephone Phone Number
   * @return {object} User object
   */
  addUser(username, email, password, telephone) {
    return this.apiCall('POST', 'users/register', { username, email, password, telephone }, false);
  }

  /*
   * Login.
   *
   * @param {string} email Email
   * @param {string} password Password
   */
  loginUser(email, password) {
    return new Promise(resolve => {
      this.apiCall('POST', 'users/login', { email, password }, false)
        .then(res => {
          this.token = res.token;
          resolve(res);
        });
    });
  }

  /*
   * Set Company information.
   *
   * @param {string} email Email
   * @param {string} password Password
   */
  setCompany(name, taxId, address, country ) {
    return this.apiCall('POST', 'companies', { name, taxId, address, country }, 'userAuth');
  }

  /*
   * Add Project.
   *
   * @param {string} name Project Name
   * @param {string} description Description
   * @param {string} network Netowrk (mimbai, polygon, testnet)
   */
  addProject(name, description, network) {
    return this.apiCall('POST', 'projects', { name, description, network }, 'userAuth');
  }

  /*
   * Get an API KEY for the project.
   *
   * @param {string} projectId ProjectId
   */
  getApiKey(projectId) {
    return new Promise(resolve => {
      this.apiCall('GET', `projects/apikey/${projectId}`, {}, 'userAuth')
        .then(res => {
          this.apiKey = res.token;
          resolve(res);
        });
    });
  }

  /*
   * Get an API KEY for the project.
   *
   * @param {string} projectId ProjectId
   */
  addCampaign(name, description, projectId) {
    return this.apiCall('POST', 'campaigns', { name, description, projectId }, 'tokenAuth');
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
        if (result.task.state === 'writing') {
          await new Promise((r) => setTimeout(r, 5000));
		} else {
          this.mkLog('Task ended');
		  return resolve(result.task);
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
   * Add a Contract
   *
   * @param {string} projectId ProjectId
   */
  writeTokenContract(name, description, symbol, campaignId, walletId, maxSupply, decimals) {
    const contract = {
      erc: 20,
      name,
      symbol,
      description,
      campaignId,
      walletId,
      maxSupply,
      decimals,
    };
    return this.apiCall('POST', 'contracts', contract, 'tokenAuth');
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
   * Get a token
   *
   * @param {string} contractId contract ID
   */
  getToken(contractId) {
    return this.apiCall('GET', `tokens/${contractId}`, {}, 'tokenAuth');
  }


}
