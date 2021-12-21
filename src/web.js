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
   * @param {string} email Email
   * @param {string} password Password
   * @param {string} telephone Phone Number
   * @return {object} User object
   */
  registerUser(email, password ) {
    return new Promise(resolve => {
      this.apiCall('POST', 'users/register', { email, password }, false)
        .then(res => {
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
  setCompany(name) {
    return this.apiCall('POST', 'companies', { name }, 'userAuth');
  }

  /*
   * Add Project.
   *
   * @param {string} name Project Name
   * @param {string} description Description
   * @param {string} network Netowrk (mimbai, polygon, testnet)
   */
  addProject(name, network) {
    return this.apiCall('POST', 'projects', { name, network }, 'userAuth');
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
   * Upload One Image to Arweave.
   *
   * @param {string} file File name with path
   */
  addImage(imageFile, imageName) {
    return new Promise((resolve) => {
      const form = new FormData();
      const image = fs.readFileSync(imageFile);
      form.append('nftImage', image, imageName);
      const config = { headers: { ...form.getHeaders(), Authorization: `Bearer ${this.token}` } };
      console.log(config);
      axios.post(`${this.api}media`, form, config)
      .then((res) => {
        resolve(res.data);
      })
      .catch((e) => log(chalk.red('Error'), e.message));
    });
  }
}

module.exports = MintKnightWeb
