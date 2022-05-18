const axios = require('axios');
const chalk = require('chalk');
const log = console.log;
const parameters = require('./config/parameters');

class MintKnightBase {
  constructor(api, props = {}) {
    this.api = api;
    this.debug = props.debug || false;
    this.token = props.token || false;
    this.apiKey = props.apiKey || false;
    this.responseType = props.responseType || 'basic';
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
      if (auth === 'userAuth' && this.token === false) {
        reject(new Error('You are not authorized. Login First.'));
      } else if (auth === 'tokenAuth' && this.apiKey === false) {
        reject(
          new Error(
            'You are not authorized. You need the API KEY for the project.'
          )
        );
      }

      const keys = Object.keys(params);
      for (let i = 0; i < keys.length; i++) {
        // Check special parameters from config.
        if (parameters[keys[i]]) {
          // Check Type
          // if (parameters[keys[i]].type && (typeof params[keys[i]] !== parameters[keys[i]].type)) { reject(new Error(`Parameter ${keys[i]} should be a ${parameters[keys[i]].type}`)) }
          // Check length.
          if (
            parameters[keys[i]].min &&
            params[keys[i]].length < parameters[keys[i]].min
          ) {
            reject(
              new Error(
                `Parameter ${keys[i]} should be at least ${
                  parameters[keys[i]].min
                } caharcters`
              )
            );
          }
          // Check Valid values.
          if (
            parameters[keys[i]].valid &&
            !parameters[keys[i]].valid.includes(params[keys[i]])
          ) {
            reject(
              new Error(
                `Parameter ${keys[i]} is not valid : ${
                  parameters[keys[i]].valid
                }`
              )
            );
          }
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
    // console.log(`${method} ${this.api}${call} ${this.apiKey}`);
    return new Promise((resolve) => {
      this.validate(params, auth)
        .then((params) => {
          let config = {};
          if (auth !== 'noAuth') {
            config =
              auth === 'userAuth'
                ? { headers: { Authorization: `Bearer ${this.token}` } }
                : { headers: { Authorization: `Bearer ${this.apiKey}` } };
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
          const status = res.data.status || false;
          if (status === 'Failed') {
            this.mkError(`${method} ${call} => ${res.data.error}`);
            if (this.responseType === 'basic')
              throw new Error(`${method} ${call} => ${res.data.error}`);
            else
              resolve({
                success: false,
                data: null,
                error: res.data.error,
                code: res.data.code ? res.data.code : 0,
                retry: res.data.retry ? true : false,
              });
            return;
          }
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

  setResponseType(type) {
    this.responseType = type;
  }
}

module.exports = MintKnightBase;
