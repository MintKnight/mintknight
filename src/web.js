const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const MintKnightBase = require('./base');
const chalk = require('chalk');
const log = console.log;

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
  registerUser(email, password) {
    return new Promise((resolve) => {
      this.apiCall(
        'POST',
        'users/v1/register',
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
      this.apiCall('POST', 'users/v1/login', { email, password }, false).then(
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
    return this.apiCall('POST', 'companies/v1', { name }, 'userAuth');
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

      axios
        .post(`${this.api}projects/v2/`, form, config)
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

      axios
        .put(`${this.api}projects/v2/${projectId}`, form, config)
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
   * Get Project.
   */
  getProject() {
    return this.apiCall('GET', 'projects/v1', {}, 'userAuth');
  }

  /*
   * Get Project.
   *
   * @param {string} projectId ProjectId
   */
  updateLimits(projectId) {
    return this.apiCall('PUT', 'projects/v1/limits', { projectId }, 'userAuth');
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
        `projects/v1/apikey/${projectId}`,
        {},
        'userAuth'
      ).then((res) => {
        this.apiKey = res.token;
        resolve(res);
      });
    });
  }
}

module.exports = MintKnightWeb;
