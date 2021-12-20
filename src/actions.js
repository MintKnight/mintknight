const fs = require('fs');
const { log, title, error, warning, detail, proceed } = require('./term');
const { promptUser, promptProject, inputText } = require('./term');
const { MintKnight, MintKnightWeb } = require('../src/index')
 const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

/**
 * Adds the conf dir if it does not exists
 */
const addConfDir = async () => {
  if (!fs.existsSync(HOMEMK)) {
    await fs.promises.mkdir(HOMEMK);
  }
}

/**
 * Connect to API - MintKnight
 *
 * @param {string} env - Environment : PRODUCTION, SANDBOX, TEST
 * @param {boolean} debug
 */
const connect = (nconf) => {
  let urlWeb, urlService;
  switch (nconf.get('ENV')) {
    case 'local':
      urlWeb = 'http://localhost:5000/';
      urlService = 'http://localhost:5001/';
    break;
    case 'sandbox':
      urlWeb = 'https://webapi.sandbox.mintknight.com/';
      urlService = 'https://webapi.sandbox.mintknight.com/';
    break;
    case 'prod':
      urlWeb = 'https://webapi.mintknight.com/';
      urlService = 'https://webapi.mintknight.com/';
    break;
  }
  const mintknight = new MintKnightWeb(urlWeb, {debug: nconf.get('DEBUG') || false});
  const token = nconf.get('user:token') || false;
  return {token, mintknight};
}

/**
 * Saves a user to the config
 *
 * @param {object} nconf
 * @param {object}user
 */
const saveConf = async (nconf, user) => {
  (user.status === 'failed') && error(user.error);
  await addConfDir();
  nconf.set('user:userId', user._id);
  nconf.set('user:token', user.token);
  nconf.set('user:companyId', user.companyId);
  nconf.save();
}

/**
 * Add a project to the config
 *
 * @param {object} nconf
 * @param {object} project
 */
const addProject = async (nconf, project) => {
  const projects = nconf.get('user:projects') || [];
  projects.push(project.projectId);
  nconf.set('user:projects', projects);
  nconf.set(`${project.projectId}:token`, project.token);
  nconf.set(`${project.projectId}:name`, project.name);
  nconf.set(`${project.projectId}:network`, project.network);
  nconf.set('user:projectId', project.projectId);
  nconf.save();
}

/**
 * Login action
 *
 * @param {string} nconf
 */
const login = async (nconf) => {
  const {token, mintknight} = connect(nconf);
  (token !== false) && error('Already logged in. Logout first (mk logout)');
  const user = await promptUser('Login');
  let result = await mintknight.loginUser(user.email, user.password);
  nconf.set('user:token', result.token);
  nconf.save();
  log('Login succesful');
}

/**
 * Register action
 *
 * @param {string} nconf
 */
const register = async (nconf) => {
  const {token, mintknight} = connect(nconf);
  log(token);
  (token !== false) && error('Already logged in. Logout first (mk logout)');

  // Register User
  const user = await promptUser('Register new user');
  const config = await mintknight.registerUser(user.email, user.password);
  (config.status === 'failed') && error(config.error);

  // Register company.
  const name = await inputText('Name of the Company');
  result = await mintknight.setCompany(name);
  config.companyId = result._id;
  await saveConf(nconf, config);

  // Add project.
  const project = await promptProject()
  result = await mintknight.addProject(project.name, project.network);
  project.projectId = result._id;

  // Get Token.
  result = await mintknight.getApiKey(project.projectId);
  project.token = result.token;
  await addProject(nconf, project);
}

/**
 * Logout action
 *
 * @param {string} nconf
 */
const logout = async (nconf) => {
  const {token, mintknight} = connect(nconf);
  (token === false) && error('Not logged in');
  nconf.set('user:token', false);
  nconf.save();
  log('Logout succesful');
}

/**
 * Info action
 *
 * @param {string} nconf
 */
const info = async (nconf) => {
  const user = nconf.get('user');
  const project = nconf.get(`${user.projectId}`);
  detail('userId', user.userId);
  detail('project', project.name, project.network);
}

module.exports = { login, register, logout, info };

