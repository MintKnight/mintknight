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
    this.responseType = props.responseType || 'detailed';
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
          this.mkLog(`${method} ${call} => Success`);
          if (this.responseType === 'basic') resolve(res.data);
          else resolve({ success: true, data: res.data, error: null });
        })
        .catch((e) => {
          const error =
            e.response && e.response.data && e.response.data.error
              ? e.response.data.error
              : e.message;
          const code =
            e.response && e.response.data && e.response.data.code
              ? e.response.data.code
              : e.message;
          this.mkError(`${method} ${call} => ${error}`);
          if (this.responseType === 'basic') resolve(false);
          else
            resolve({
              success: false,
              data: null,
              error,
              code,
            });
        });
    });
  }

  setResponseType(value) {
    this.responseType = value;
  }

  setToken(value) {
    this.token = value;
  }

  setApiKey(value) {
    this.apiKey = value;
  }
}

module.exports = MintKnightBase;
