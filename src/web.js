const axios = require('axios');
const chalk = require('chalk');
const FormData = require('form-data');
const fs = require('fs');
const log = console.log;
const MintKnightBase = require('./base');

class MintKnightWeb extends MintKnightBase {
  constructor(api, props = {}) {
    super(api, props);
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
   * Add a ERC20 Contract
   *
   * @param {string} projectId ProjectId
   */
  writeTokenContract(name, symbol, description, campaignId) {
    const contract = {
      erc: 20,
      name,
      symbol,
      description,
      campaignId,
    };
    return this.apiCall('POST', 'contracts', contract, 'tokenAuth');
  }

  /*
   * Add a NFT Contract
   *
   * @param {string} projectId ProjectId
   */
  writeNFTContract(name, symbol, description, campaignId, walletId ) {
    const contract = {
      erc: 721,
      name,
      symbol,
      description,
      campaignId,
    };
    return this.apiCall('POST', 'contracts', contract, 'tokenAuth');
  }
}

module.exports = MintKnightWeb
