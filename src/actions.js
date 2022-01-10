const fs = require('fs');
const path = require('path');
const { Prompt, Select } = require('./term');
const { log, title, error, warning, detail } = require('./term');
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
  const env = nconf.get('env');
  switch (env) {
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
  let service = false;
  const token = nconf.get(`${env}:token`) || false;
  const props = {
    debug: nconf.get('debug') || true,
	  token,
  }
  const projectId = nconf.get(`${env}:projectId`);
  const mintknight = new MintKnightWeb(urlWeb, props);
  if (projectId) {
    props.apiKey = nconf.get(`${projectId}:token`);
    service = new MintKnight(urlService, props);
  }
  return {token, mintknight, service};
}
/**
 * Toggle debug value
 */
const toggleDebug = async (nconf) => {
  const debug = nconf.get('debug');
  nconf.set('debug', !debug);
  nconf.save();
  log(`Debug set to ${!debug}`);
}

/**
 * Saves a user to the config
 *
 * @param {object} nconf
 * @param {object}user
 */
const saveUser = async (nconf, user) => {
  (user.status === 'failed') && error(user.error);
  await addConfDir();
  const env = nconf.get('env');
  nconf.set('debug', false);
  nconf.set(`${env}:userId`, user._id);
  nconf.set(`${env}:token`, user.token);
  nconf.set(`${env}:companyId`, user.companyId);
  nconf.save();
}

/**
 * Add a project to the config
 *
 * @param {object} nconf
 * @param {object} project
 */
const addProject = async (nconf, project) => {
  const env = nconf.get('env');
  const projects = nconf.get(`${env}:projects`) || [];
  projects.push(project.projectId);
  nconf.set(`${env}:projects`, projects);
  nconf.set(`${env}:projectId`, project.projectId);
  nconf.set(`${env}:${project.projectId}:token`, project.token);
  nconf.set(`${env}:${project.projectId}:name`, project.name);
  nconf.set(`${env}:${project.projectId}:network`, project.network);
  nconf.save();
}

/**
 * Add a wallet to the config
 *
 * @param {object} nconf
 * @param {object} project
 */
const addWallet = async (nconf, wallet) => {
  const wallets = nconf.get('user:wallets') || [];
  wallets.push(wallet.walletId);
  nconf.set('user:wallets', wallets);
  nconf.set(`${wallet.walletId}:name`, wallet.name);
  nconf.set(`${wallet.walletId}:skey`, wallet.skey);
  nconf.set(`${wallet.walletId}:address`, wallet.address);
  nconf.set('user:walletId', wallet.walletId);
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
  const user = await Prompt.user('Login');
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
  const env = nconf.get('env');
  (env !== undefined) && error('Already registered. A config file already exists');

  // Register User
  const user = await Prompt.user('Register new user');
  nconf.set('env', user.env);
  nconf.save();

  const {token, mintknight} = connect(nconf);
  const config = await mintknight.registerUser(user.email, user.password);
  (config === false) && error('Error while registering the user');
  (config.status === 'failed') && error(config.error);

  // Register company.
  warning(`\nCompany and Project`);
  const name = await Prompt.text('Name of the Company');
  result = await mintknight.setCompany(name);
  config.companyId = result._id;
  await saveUser(nconf, config);

  // Add project.
  const project = await Prompt.project()
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
  const env = nconf.get('env');
  nconf.set(`${env}:token`, false);
  nconf.save();
  log('Logout succesful');
}

/**
 * Info action
 *
 * @param {string} nconf
 */
const info = (nconf) => {
  const env = nconf.get('env');
  const user = nconf.get(env);
  detail('userId', user.userId);
  const project = nconf.get(`${env}:${user.projectId}`);
  project.projectId = user.projectId;
  detail('project', project.name, project.network);
  let wallet = {}
  if (user.walletId) {
    wallet = nconf.get(`${user.walletId}`);
    wallet.walletId = user.walletId;
    detail('wallet', wallet.name);
  }
  return {user, project, wallet};
}

/**
 * Add a new Project
 *
 * @param {string} nconf
 */
const newProject = async (nconf) => {
  const {token, mintknight} = connect(nconf);

  // Add project.
  const project = await Prompt.project()
  let result = await mintknight.addProject(project.name, project.network);
  (result === false) && error('Error while adding a Project');
  project.projectId = result._id;

  // Get Token.
  result = await mintknight.getApiKey(project.projectId);
  project.token = result.token;
  await addProject(nconf, project);
}

/**
 * Select a Project
 *
 * @param {string} nconf
 */
const selProject = async (nconf) => {
  const env = nconf.get('env');
	const projects = nconf.get(`${env}:projects`);
	if (projects.length < 2) {
	  warning('Only one project available. Already selected');
	} else {
	  const choices = [];
    log(projects);
    for (let i = 0;i < projects.length; i++) {
      const project = nconf.get(`${env}:${projects[i]}`);
		  const choice = {
		    title: project.name,
        description: `${project.name} (${project.network})`,
        value: projects[i]
		  }
  	 choices.push(choice);
	  }
  	const projectId = await Select.project(choices);
    nconf.set(`${env}:projectId`, projectId);
    nconf.save();
    log(`Project changed to ${projectId}`);
	}
}

/**
 * Select a Wallet
 *
 * @param {string} nconf
 */
const selWallet = async (nconf) => {
	const wallets = nconf.get('user:wallets');
	if (wallets.length < 2) {
	  warning('Only one wallet available. Already selected');
	} else {
	  const choices = [];
      for (let i = 0;i < wallets.length; i++) {
		const wallet = nconf.get(wallets[i]);
		const choice = {
		  title: wallet.name,
		  description: `${wallet.name} (${wallet.address})`,
		  value: wallets[i]
		}
		choices.push(choice);
	  }
	  const walletId = await Select.wallet(choices);
      nconf.set('user:walletId', walletId);
      nconf.save();
      log('Wallet changed');
	}
}

/**
 * Add a new Wallet
 *
 * @param {string} nconf
 */
const newWallet = async (nconf) => {
  const {token, mintknight, service} = connect(nconf);

  const {user, project} = info(nconf);
  // Add wallet.
  const wallet = await Prompt.wallet(project.name)
  let task = await service.addWallet(wallet.ref);
  const taskId = task.taskId;
  wallet.walletId = task.wallet._id;
  wallet.skey = task.skey1;
  task = await service.waitTask(task.taskId);
  wallet.address = task.addressTo;
  await addWallet(nconf, wallet);
}

/**
 * Add a new Contract
 *
 * @param {string} nconf
 */
const newContract = async (nconf) => {
  const {token, mintknight, service} = connect(nconf);
  const {user, project, wallet} = info(nconf);
  // Add contract.
  const contract = await Prompt.contract(project.name)
  let task = await service.addContract(
    contract.name,
    contract.symbol,
    contract.contractType,
    wallet.walletId
  );
  const taskId = task.taskId;
  task = await service.waitTask(task.taskId);
//   wallet.address = task.addressTo;
 //  await addWallet(nconf, wallet);
}

/**
 * Add a newImage to media Lib.
 *
 * @param {string} nconf
 */
const newImage = async (nconf, img = false) => {
  // Check
  (img === false) && error('Image needed. mk add image nft.png');
  (!fs.existsSync(img)) && error(`File ${img} does not exist`);
  const { name, ext } = path.parse(img);
  (!['.png'].includes(ext)) && error(`Invalid extension. Only png is valid`)

  // Connect
  const {token, mintknight, service } = connect(nconf);
  const result = await service.addImage(img, `${name}${ext}`);
}

module.exports = { login, register, logout, info, newProject, selProject, newWallet, selWallet, newImage, newContract, toggleDebug};

