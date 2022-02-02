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
  let urlWeb, urlService, contractId = false;
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
    case 'production':
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
    contractId = nconf.get(`${env}:${projectId}:contractId`);
    props.apiKey = nconf.get(`${env}:${projectId}:token`);
    service = new MintKnight(urlService, props, env, projectId, contractId);
  }
  return {token, mintknight, service, env, contractId, projectId};
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
  const env = nconf.get('env');
  const projectId = nconf.get(`${env}:projectId`);
  const wallets = nconf.get(`${env}:${projectId}:wallets`) || [];
  wallets.push(wallet.walletId);
  nconf.set(`${env}:${projectId}:wallets`, wallets);
  nconf.set(`${env}:${projectId}:${wallet.walletId}:name`, wallet.name);
  nconf.set(`${env}:${projectId}:${wallet.walletId}:skey`, wallet.skey);
  nconf.set(`${env}:${projectId}:${wallet.walletId}:address`, wallet.address);
  nconf.set(`${env}:${projectId}:walletId`, wallet.walletId);
  nconf.save();
}

/**
 * Add a contract to the config
 *
 * @param {object} nconf
 * @param {object} contract
 */
const addContract = async (nconf, contract, wallet) => {
  const env = nconf.get('env');
  const projectId = nconf.get(`${env}:projectId`);
  const contracts = nconf.get(`${env}:${projectId}:contracts`) || [];
  contracts.push(contract.contractId);
  nconf.set(`${env}:${projectId}:contracts`, contracts);
  nconf.set(`${env}:${projectId}:${contract.contractId}:name`, contract.name);
  nconf.set(`${env}:${projectId}:${contract.contractId}:owner`, wallet.address);
  nconf.set(`${env}:${projectId}:${contract.contractId}:type`, contract.contractType);
  nconf.set(`${env}:${projectId}:contractId`, contract.contractId);
  nconf.save();
}

const checkOwner = (env, nconf) => {
  const projectId = nconf.get(`${env}:projectId`);
  const walletId = nconf.get(`${env}:${projectId}:walletId`);
  const wallet = nconf.get(`${env}:${projectId}:${walletId}`);
  const contractId = nconf.get(`${env}:${projectId}:contractId`);
  const contract = nconf.get(`${env}:${projectId}:${contractId}`);
  if (contract && wallet.address !== contract.owner) {
    warning('\nCurrent wallet is not the owner of the selected contract');
    return false;
  }
  return true;
}

class Actions {

  /**
   * Help Action.
   */
  static async help() {
	title('\nStart and register');
	detail('mk', 'Information on the current setup : project, wallet, contract');
	detail('mk help', 'Basic help');
	detail('mk register', 'Create a new user and Project');
	title('\nProjects');
	detail('mk add project', 'Adds a new project');
	detail('mk info project', 'Queries stats for current project');
	detail('mk select project', 'Select Active project');
	title('\nWallets');
	detail('mk add wallet', 'Adds a new wallet');
	detail('mk add signer', 'Adds a new signer (wallet off-chain)');
	detail('mk select wallet', 'Select Active wallet');
	title('\nContracts');
	detail('mk add contract', 'Adds a new contract');
	detail('mk select contract', 'Select Active contract');
	detail('mk list nft', 'List NFTs in th Contract')

	title('\nNFTs');
	detail('mk mint', 'Mint to the selected Contract')
	detail('mk info nft', 'Get the metadata for an NFT')
	detail('mk update nft', 'Update the metadata for an NFT')

	title('\nMedia');
	detail('mk add media <file>', 'Adds a new image to the media Library');
	detail('mk list media', 'List media for that contract');
	log('\n');
  }
 
  /**
   * Toggle debug value
   */
  static async setup(nconf) {
    await addConfDir();
    const env = await Prompt.env('Setup environment');
    nconf.set('env', env);
    nconf.save();
    log(`Setup to ${env}`);
  }

  /**
   * Init and setup Env.
   */
  static async toggleDebug(nconf) {
    const debug = nconf.get('debug');
    nconf.set('debug', !debug);
    nconf.save();
    log(`Debug set to ${!debug}`);
  }

  /**
   * Info action
   */
  static info(nconf) {
    const env = nconf.get('env');
    const user = nconf.get(env);
    const project = user[user.projectId];
    project.projectId = user.projectId;
    detail('project', project.name, project.network);
    let wallet = {}
    let contract = {}
    if (project.walletId) {
      wallet = nconf.get(`${env}:${project.projectId}:${project.walletId}`);
      wallet.walletId = project.walletId;
      detail('wallet', wallet.name);
    }
    if (project.contractId) {
      contract = nconf.get(`${env}:${project.projectId}:${project.contractId}`);
      contract.contractId = project.contractId;
      detail('contract', contract.name);
    }
    return {user, project, wallet, contract};
  }


  /**
   * Register action
   */
  static async register(nconf) {
    const env = nconf.get('env');
    if (env === undefined) {
      nconf.set('env', 'production');
      nconf.save();
    }

    const registeredUser = nconf.get(`${env}`);
    (registeredUser !== undefined) && error('Already registered. A config file already exists');

    // Register User
    const user = await Prompt.user('Register new user');

    const { mintknight } = connect(nconf);
    const config = await mintknight.registerUser(user.email, user.password);
    (config === false) && error('Error while registering the user');
    (config.status === 'failed') && error(config.error);

    // Register company.
    warning(`\nCompany and Project`);
    const name = await Prompt.text('Name of the Company');
    let result = await mintknight.setCompany(name);
    config.companyId = result._id;
    await saveUser(nconf, config);

    // Add project.
    const project = await Prompt.project(env)
    result = await mintknight.addProject(project.name, project.network);
    log('SAVE', result)
    project.projectId = result._id;

    // Get Token.
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.token;
    await addProject(nconf, project);
  }

  /**
   * Add a new Project
   */
  static async newProject(nconf) {
    const { mintknight } = connect(nconf);

    // Add project.
    const project = await Prompt.project(nconf.get('env'));
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
   */
  static async selProject(nconf) {
    const env = nconf.get('env');
    const projects = nconf.get(`${env}:projects`);
    if (projects.length < 2) {
      warning('Only one project available. Already selected');
    } else {
      const choices = [];
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
   * Info Project.
   */
  static async infoProject(nconf) {
    const { mintknight } = connect(nconf);
    const nft = await mintknight.getProject();
    console.log(nft);
  }

  /**
   * Add a new Wallet
   */
  static async newWallet(nconf, walletType) {
    const { service } = connect(nconf);
    const { project } = Actions.info(nconf);

    // Add wallet.
    const wallet = await Prompt.wallet(project.name)
    let task = await service.addWallet(wallet.ref, walletType);
    wallet.walletId = task.wallet._id;
    wallet.skey = task.skey1;
    task = await service.waitTask(task.taskId);
    wallet.address = task.contractAddress;
    await addWallet(nconf, wallet);
  }

  /**
   * Select a Wallet
   */
  static async selWallet(nconf) {
    const env = nconf.get('env');
    const projectId = nconf.get(`${env}:projectId`);
    const wallets = nconf.get(`${env}:${projectId}:wallets`);
    if (wallets.length < 2) {
      warning('Only one wallet available. Already selected');
    } else {
      const choices = [];
      for (let i = 0;i < wallets.length; i++) {
        const wallet = nconf.get(`${env}:${projectId}:${wallets[i]}`);
        const choice = {
          title: wallet.name,
          description: `${wallet.name} (${wallet.address})`,
          value: wallets[i] 
        }
	    choices.push(choice);
      }
      const walletId = await Select.wallet(choices);
      nconf.set(`${env}:${projectId}:walletId`, walletId);
      nconf.save();
      checkOwner(env, nconf);
      log('Wallet changed');
    }
  }

  /**
   * Add a new Contract
   */
  static async newContract(nconf) {
    const { service } = connect(nconf);
    const { project, wallet } = Actions.info(nconf);
    // Add contract.
    const contract = await Prompt.contract(project.name)
    let task = await service.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      wallet.walletId
    );
    task = await service.waitTask(task.taskId);
    contract.address = task.contractAddress;
    contract.contractId = task.contractId;
    await addContract(nconf, contract, wallet);
  }

  /**
   * Select a Contract
   */
  static async selContract(nconf) {
    const env = nconf.get('env');
    const projectId = nconf.get(`${env}:projectId`);
    const contracts = nconf.get(`${env}:${projectId}:contracts`);
    if (contracts.length < 2) {
      warning('Only one Contract available. Already selected');
    } else {
      const choices = [];
      for (let i = 0;i < contracts.length; i++) {
        const contract = nconf.get(`${env}:${projectId}:${contracts[i]}`);
		  log(contract);
        const choice = {
          title: contract.name,
          description: `${contract.name}`,
          value: contracts[i] 
        }
	    choices.push(choice);
      }
      const contractId = await Select.contract(choices);
      nconf.set(`${env}:${projectId}:contractId`, contractId);
      nconf.save();
      checkOwner(env, nconf);
      log('Contract changed');
    }
  }

  /**
   * Add a newImage to media Lib.
   */
  static async newMedia(nconf, img = false) {
    // Check
    (img === false) && error('Image needed. mk add media ./assets/nft.png');
    (!fs.existsSync(img)) && error(`File ${img} does not exist`);
    const { name, ext } = path.parse(img);
    (!['.png'].includes(ext)) && error(`Invalid extension. Only png is valid`)

    // Connect
    const { service } = connect(nconf);
    let task = await service.addMedia(img, `${name}${ext}`);
    task = await service.waitTask(task.taskId);
    log('Media added');
  }

  /**
   * List all media files.
   */
  static async listMedia(nconf) {
    const { service } = connect(nconf);
    let media = await service.getMedia();
  	for (let i = 0; i< media.length; i ++) {
	    title(`\n${media[i]._id}`);
      detail(media[i].name, media[i].url);
	  }
  }

  /**
   * Mint a new NFT/Token
   */
  static async mint(nconf) {
    const { service, env, projectId, contractId } = connect(nconf);
    (checkOwner(env, nconf) === false) && error('Invalid Wallet');
    // Get metadata
    const nft = await Prompt.nft();

    // Get destination.
    const wallets = nconf.get(`${env}:${projectId}:wallets`);
    const choices = [];
    for (let i = 0;i < wallets.length; i++) {
      const wallet = nconf.get(`${env}:${projectId}:${wallets[i]}`);
      const choice = {
        title: wallet.name,
        description: `${wallet.name} (${wallet.address})`,
        value: wallets[i] 
      }
      choices.push(choice);
    }
  	choices.push({
      title: 'WalletId',
      description: 'A Mintknight Wallet',
      value: 'walletId', 
	  })
  	choices.push({
      title: 'Address',
      description: 'Network public address',
      value: 'address',
	  })
    let walletId = await Select.wallet(choices);
  	if (walletId === 'walletId') {
	    walletId = await Prompt.text('WalletId');
  	} else if (walletId === 'address') {
	    walletId = await Prompt.text('Address');
  	}
    const minterId = nconf.get(`${env}:${projectId}:walletId`);
    const minter = nconf.get(`${env}:${projectId}:${minterId}`);
	  let task = await service.mintNFT(contractId, minterId, minter.skey, walletId, nft );
    task = await service.waitTask(task.taskId);
    log('NFT Minted');
  }

  /**
   * Update NFT metadata
   */
  static async updateNft(nconf) {
    const { service, contractId } = connect(nconf);
	  const tokenId = await Prompt.text('TokenId');
    const attributes = [];
    let attribute = true;
    while (attribute !== false) {
	    attribute = await Prompt.attribute();
      (attribute !== false) && attributes.push(attribute);
  	}
	  let task = await service.updateNFT(contractId, tokenId, attributes);
    log('NFT Updated');
  }

  /**
   * List NFTs.
   */
  static async listNft(nconf) {
    const { service, contractId } = connect(nconf);
    const nfts = await service.getNfts(contractId);
  	for (let i = 0; i< nfts.length; i ++) {
	    title(`\n${nfts[i].name}`);
      detail('tokenId', nfts[i].tokenId);
	  }
  }

  /**
   * Metadata NFTs.
   */
  static async infoNft(nconf) {
    const { service, contractId } = connect(nconf);
	  const tokenId = await Prompt.text('TokenId');
    const nft = await service.getNft(contractId, tokenId);
    console.log(nft);
  }

  /**
   * Update Limits (only admin).
   */
  static async updateLimits(nconf) {
    const { mintknight } = connect(nconf);
    const projectId = await Prompt.text('ProjectId');
    const limits = await mintknight.updateLimits(projectId);
    log(limits)
    log('Limits updated');
  }
}

/**
 * Logout action
 *
 * @param {string} nconf
 */
/* 
  const logout = async (nconf) => {
  const {token, mintknight} = connect(nconf);
  (token === false) && error('Not logged in');
  const env = nconf.get('env');
  nconf.set(`${env}:token`, false);
  nconf.save();
  log('Logout succesful');
}
*/

/**
 * Login action
 *
 * @param {string} nconf
 */
/*
  const login = async (nconf) => {
  const {token, mintknight} = connect(nconf);
  (token !== false) && error('Already logged in. Logout first (mk logout)');
  const user = await Prompt.user('Login');
  let result = await mintknight.loginUser(user.email, user.password);
  nconf.set('user:token', result.token);
  nconf.save();
  log('Login succesful');
}
*/


module.exports = { Actions };

