const axios = require('axios');
const chalk = require('chalk');
const log = console.log;
const parameters = require('./config/parameters')

module.exports = class MintKnight {

  constructor(api, props = {}) {
    this.api = api;
    this.debug = props.debug || false;
    this.token = false;
  }

  /*
   * mintknight Log
   */
  mkLog(res) {
    if (this.debug) log(chalk.blue('Log'), res);
  }

  /*
   * mintknight Error
   */
  mkError(e) {
    if (this.debug) log(chalk.red('Error'), e.message);
  }

  /*
   * Validate input parameters
   */
  validate(params, auth) {
    return new Promise((resolve, reject) => {
      if (auth && this.token === false) {
        reject(new Error(`You are not authorized. Login First.`));
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
  apiCall(method, call, params, auth) {
    return new Promise(resolve => {
      this.validate(params, auth)
       .then((params) => {
         const config = { headers: { Authorization: `Bearer ${this.token}` } };
         switch (method) {
           case 'POST':
             return axios.post(`${this.api}${call}`, params, config);
           case 'PUT':
             return axios.put(`${this.api}${call}`, paramsi, config);
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
         this.mkError(e);
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
  setCompany(name, taxId, address, country) {
    return this.apiCall('POST', 'companies', { name, taxId, address, country });
  }

  /*
   * Add Project.
   *
   * @param {string} name Project Name
   * @param {string} description Description
   * @param {string} network Netowrk (mimbai, polygon, testnet)
   */
  addProject(name, description, network) {
    return this.apiCall('POST', 'projects', { name, description, network});
  }

}
