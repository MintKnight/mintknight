const fs = require('fs');
const path = require('path');
const { Prompt, Select } = require('./term');
const { log, title, error, warning, detail } = require('./term');
const { MintKnight } = require('../src/index');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

/**
 * Add the conf dir if it does not exists
 */
const addConfDir = async () => {
  if (!fs.existsSync(HOMEMK)) {
    await fs.promises.mkdir(HOMEMK);
  }
};

const waitTask = async (task, mintknight, msgOk, msgKo) => {
  if (task === false) error(msgKo);
  const result = await mintknight.waitTask(task.taskId);
  if (result.state === 'failed') error(msgKo);
  log(msgOk);
  return result;
};

/**
 * Connect to API - MintKnight
 *
 * @param {string} env - Environment : PRODUCTION, SANDBOX, TEST
 * @param {boolean} debug
 */
const connect = (nconf) => {
  let urlApi;
  let contractId = false;
  let walletId = false;
  let network = false;
  const env = nconf.get('env');
  switch (env) {
    case 'local':
      urlApi = 'http://localhost:3001/';
      break;
    case 'dev':
      urlApi = 'https://api.dev.mintknight.com/';
      break;
    case 'sandbox':
      urlApi = 'https://api.sandbox.mintknight.com/';
      break;
    case 'production':
      urlApi = 'https://api.mintknight.com/';
      break;
  }
  const token = nconf.get(`${env}:token`) || false;
  const props = {
    debug: nconf.get('debug') || true,
    token,
  };
  const projectId = nconf.get(`${env}:projectId`);
  if (projectId) {
    walletId = nconf.get(`${env}:${projectId}:walletId`);
    contractId = nconf.get(`${env}:${projectId}:contractId`);
    props.apiKey = nconf.get(`${env}:${projectId}:token`);
    network = nconf.get(`${env}:${projectId}:network`);
  }
  const mintknight = new MintKnight(urlApi, props);
  return {
    token,
    mintknight,
    env,
    contractId,
    projectId,
    walletId,
    network,
  };
};

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
};
class Config {
  /**
   * Saves a user to the config
   *
   * @param {object} nconf
   * @param {object}user
   */
  static async saveUser(nconf, user) {
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
  static async addProject(nconf, project) {
    const env = nconf.get('env');
    const projects = nconf.get(`${env}:projects`) || [];
    projects.push(project.projectId);
    nconf.set(`${env}:projects`, projects);
    nconf.set(`${env}:projectId`, project.projectId);
    nconf.set(`${env}:${project.projectId}:token`, project.token);
    nconf.set(`${env}:${project.projectId}:name`, project.name);
    nconf.set(`${env}:${project.projectId}:network`, project.network);
    nconf.set(`${env}:${project.projectId}:thumb`, project.thumb);
    nconf.save();
  }

  /**
   * Update project to the config
   *
   * @param {object} nconf
   * @param {object} project
   */
  static async updateProject(nconf, project) {
    const env = nconf.get('env');
    nconf.set(`${env}:${project.projectId}:name`, project.name);
    nconf.set(`${env}:${project.projectId}:thumb`, project.thumb);
    nconf.save();
  }

  /**
   * Get projectId
   *
   * @param {object} nconf
   * @returns {string} Project ID
   */
  static async getProjectId(nconf) {
    const env = nconf.get('env');
    return nconf.get(`${env}:projectId`);
  }

  /**
   * Add a wallet to the config
   *
   * @param {object} nconf
   * @param {object} project
   */
  static async addWallet(nconf, wallet) {
    const env = nconf.get('env');
    const projectId = nconf.get(`${env}:projectId`);
    const wallets = nconf.get(`${env}:${projectId}:wallets`) || [];
    wallets.push(wallet.walletId);
    nconf.set(`${env}:${projectId}:wallets`, wallets);
    nconf.set(`${env}:${projectId}:${wallet.walletId}:name`, wallet.name);
    nconf.set(`${env}:${projectId}:${wallet.walletId}:skey`, wallet.skey);
    nconf.set(`${env}:${projectId}:${wallet.walletId}:address`, wallet.address);
    nconf.set(`${env}:${projectId}:${wallet.walletId}:type`, wallet.type);
    nconf.set(`${env}:${projectId}:walletId`, wallet.walletId);
    nconf.save();
  }

  /**
   * Add a contract to the config
   *
   * @param {object} nconf
   * @param {object} contract
   */
  static async addContract(nconf, contract, wallet) {
    const env = nconf.get('env');
    const projectId = nconf.get(`${env}:projectId`);
    const contracts = nconf.get(`${env}:${projectId}:contracts`) || [];
    const contractId = `${env}:${projectId}:${contract.contractId}`;
    contracts.push(contract.contractId);
    nconf.set(`${env}:${projectId}:contracts`, contracts);
    nconf.set(`${contractId}:name`, contract.name);
    nconf.set(`${contractId}:owner`, wallet.address);
    nconf.set(`${contractId}:type`, contract.contractType);
    nconf.set(`${contractId}:address`, contract.address);
    nconf.set(`${env}:${projectId}:contractId`, contract.contractId);
    nconf.set(`${contractId}:thumb`, contract.thumb);
    nconf.save();
  }

  /**
   * Update contract to the config
   *
   * @param {object} nconf
   * @param {object} contract
   * @param {string} address
   */
  static async updateContract(nconf, contract, address) {
    const env = nconf.get('env');
    const projectId = nconf.get(`${env}:projectId`);
    const contractId = `${env}:${projectId}:${contract.contractId}`;
    nconf.set(`${contractId}:address`, address);
    nconf.save();
  }
}
class Actions {
  /**
   * Help Action.
   */
  static async help() {
    title('\nStart and register');
    detail(
      'mk',
      'Information on the current setup : project, wallet, contract'
    );
    detail('mk help', 'Basic help');
    detail('mk register', 'Create a new user and Project');

    title('\nProjects');
    detail('mk add project', 'Add a new project');
    detail('mk update project', 'update Selected project');
    detail('mk info project', 'Queries stats for current project');
    detail('mk select project', 'Select Selected project');

    title('\nWallets');
    detail('mk add wallet', 'Add a new wallet');
    detail('mk add signer', 'Add a new signer (wallet off-chain)');
    // detail('mk add eoa', 'Add a new eoa (Externally Owned Account,)');
    detail('mk deploy wallet', 'Deploys a wallet');
    detail('mk info wallet', 'Queries stats for current wallet');
    detail('mk select wallet', 'Select Active wallet');

    title('\nContracts');
    detail('mk add contract', 'Add a new contract');
    detail('mk update contract', 'Update the active contract');
    detail('mk deploy contract', 'Deploys selected contract');
    detail('mk info contract', 'Queries stats for current contract');
    detail('mk select contract', 'Select Active contract');
    // detail('mk update minter', 'Update the contract´s minter');
    // detail('mk update owner', 'Update the contract´s owner');
    // detail('mk update verifier', 'Update the contract´s verifier');

    title('\nDrops');
    detail('mk add drop', 'Add a new drop');
    detail('mk update drop', 'Update a drop in the contract');
    detail('mk list drop', 'List all Drops in the contract');

    title('\nDrop strategies');
    detail('mk add dropstrategy', 'Add a new Drop strategy');
    detail('mk update dropstrategy', 'Update a drop strategy');
    detail('mk list dropstrategy', 'List all Drop strategies in a drop');

    title('\nDrop codes');
    detail('mk add dropcode', 'Add a new Drop codes (solo or bulk mode)');
    detail('mk update dropcode', 'Update a drop code');
    detail('mk list dropcode', 'List all Drop codes in a drop');

    // title('\nDrop users');
    // detail('mk add dropuser', 'Add a new user');
    // detail('mk list dropuser', 'List all Drop users in the contract');

    title('\nNFTs');
    detail('mk add nft', 'Add news NFT/s (draft)');
    detail('mk update nft', 'Update an NFT (draft)');
    detail('mk mint nft', 'Mint an NFT');
    detail('mk transfer nft', 'Transfer an NFT owned by the current Wallet');
    detail('mk info nft', 'Get the metadata for an NFT');
    detail('mk list nft', 'List NFTs');

    title('\nMedia');
    detail('mk add media <file>', 'Add a new image to the media Library');
    detail('mk upload media', 'Upload media into Arweave');
    detail('mk list media', 'List media for that contract');

    title('\nTokens ERC20');
    detail('mk mint token', 'Mint to the selected Contract');
    detail('mk transfer token', 'Transfer an NFT owned by the current Wallet');
    detail('mk info token', 'Get token info');

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
    if (!user || !user.projectId) {
      error('User not registered. You should do: mk register');
      return;
    }
    const project = user[user.projectId];
    project.projectId = user.projectId;
    detail('project', project.name, project.network);
    let wallet = {};
    let contract = {};
    if (project.walletId) {
      wallet = nconf.get(`${env}:${project.projectId}:${project.walletId}`);
      wallet.walletId = project.walletId;
      detail('wallet', wallet.name, wallet.type);
    }
    if (project.contractId) {
      contract = nconf.get(`${env}:${project.projectId}:${project.contractId}`);
      contract.contractId = project.contractId;
      detail('contract', contract.name, contract.type);
    }
    return { user, project, wallet, contract };
  }

  /**
   * Register action
   */
  static async register(nconf) {
    let result,
      config = {};
    const env = nconf.get('env');
    if (env === undefined) {
      nconf.set('env', 'production');
      nconf.save();
    }

    const registeredUser = nconf.get(`${env}`);
    if (registeredUser !== undefined)
      error('Already registered. A config file already exists');

    // Register User
    const user = await Prompt.user('Register new user');

    const { mintknight } = connect(nconf);
    result = await mintknight.registerUser(user.email, user.password);
    if (!result.success) error('Error while registering the user');
    config = result.data;

    // Connect to MintKnight Api with the user Token.
    mintknight.setToken(result.data.token);

    // Register company.
    warning('\nCompany and Project');
    const name = await Prompt.text('Name of the Company');
    result = await mintknight.setCompany(name);
    if (!result.success) error('Error adding company');
    config.companyId = result.data._id;
    await Config.saveUser(nconf, config);

    // Add project.
    const project = await Prompt.project(env);
    result = await mintknight.addProject(
      project.name,
      project.network,
      project.thumb
    );
    if (!result.success) error('Error adding project');
    project.projectId = result.data._id;

    // Get Token.
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.data.token;
    await Config.addProject(nconf, project);
  }

  /**
   * Add a new Project
   */
  static async newProject(nconf) {
    let name2;
    let ext2;
    const { mintknight } = connect(nconf);

    // Add project.
    const project = await Prompt.project(nconf.get('env'));

    if (!!project.thumb) {
      console.log('with thumb');
      if (!fs.existsSync(project.thumb))
        error(`File ${project.thumb} does not exist`);
      const { name, ext } = path.parse(project.thumb);
      name2 = name;
      ext2 = ext;
      if (!['.png', '.jpg', '.gif', '.pdf'].includes(ext))
        error('Invalid extension. Only .png, .jpg, .gif  is valid');
    }

    let result = await mintknight.addProject(
      project.name,
      project.network,
      project.thumb,
      `${name2}${ext2}`
    );
    if (!result.success)
      error(!!result.error ? result.error : 'Error adding Project');

    project.projectId = result.data._id;

    // Get Token.
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.data.token;

    // Add project
    await Config.addProject(nconf, project);

    // Set the project Token.
    mintknight.setApiKey(project.token);
  }

  /**
   * Updates Selected Project
   */
  static async updateProject(nconf) {
    let name2;
    let ext2;
    const env = nconf.get('env');
    const user = nconf.get(env);
    if (!user || !user.projectId) {
      error(
        'User not registered. Or you have to create a project before update it'
      );
      return;
    }
    const projectId = user.projectId;

    const { mintknight } = connect(nconf);

    // Get project
    const project = await Prompt.project(nconf.get('env'));

    if (!!project.thumb) {
      console.log('with thumb');
      if (!fs.existsSync(project.thumb))
        error(`File ${project.thumb} does not exist`);
      const { name, ext } = path.parse(project.thumb);
      name2 = name;
      ext2 = ext;
      if (!['.png', '.jpg', '.gif', '.pdf'].includes(ext))
        error('Invalid extension. Only .png, .jpg, .gif  is valid');
    }

    let result = await mintknight.UpdateProject(
      projectId,
      project.name,
      project.network,
      project.thumb,
      `${name2}${ext2}`
    );
    if (!result.success)
      error(!!result.error ? result.error : 'Error adding Project');
    project.projectId = result.data._id;

    // Update project
    await Config.updateProject(nconf, project);
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
      for (let i = 0; i < projects.length; i += 1) {
        const project = nconf.get(`${env}:${projects[i]}`);
        const choice = {
          title: project.name,
          description: `${project.name} (${project.network})`,
          value: projects[i],
        };
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
    const result = await mintknight.getProject();
    if (!result.success) error('Error getting NFT');
    console.log(result.data);
  }

  /**
   * Add a new Wallet
   */
  static async newWallet(nconf, walletType) {
    const { mintknight } = connect(nconf);
    const { project } = Actions.info(nconf);

    // Add wallet.
    const wallet = await Prompt.wallet(project.name, walletType);
    let addWalletRet = await mintknight.addWallet(wallet.refUser, walletType);
    if (!addWalletRet.success) error('Error adding wallet');
    const walletId = addWalletRet.data.wallet._id.toString();
    wallet.walletId = walletId;
    wallet.address = addWalletRet.data.wallet.address;
    wallet.skey = addWalletRet.data.skey1;
    wallet.type = walletType;

    if (walletType === 'onchain') {
      // Deploy wallet?
      const choices = [
        {
          title: 'Deploy wallet',
          description: 'Deploy wallet into blockchain',
          value: true,
        },
        {
          title: 'Not to deploy',
          description: 'Wallet remains on draft into DB',
          value: false,
        },
      ];
      const deploy = await Select.option(choices);
      if (deploy) {
        let deployWalletRet = await mintknight.deployWallet(walletId);
        if (!deployWalletRet.success) error('Error adding wallet');
        if (!!deployWalletRet.data.taskId) {
          const task = await mintknight.waitTask(deployWalletRet.data.taskId);
          if (task.state === 'failed') error('Wallet creation failed');
          wallet.address = task.address;
        }
      }
    }
    await Config.addWallet(nconf, wallet);
  }

  /**
   * Deploys a draft wallet
   */
  static async deployWallet(nconf) {
    const { mintknight } = connect(nconf);
    const walletId = await Prompt.text('Wallet ID');
    if (!walletId) error(`Wallet ID is required`);
    const result = await mintknight.deployWallet(walletId);
    if (!result.success) error('Error deploying wallet');
    const task = await mintknight.waitTask(result.data.taskId);
    if (task == false || (task.state && task.state.toLowerCase() == 'failed'))
      error(`Error deploying wallet`);
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
      for (let i = 0; i < wallets.length; i += 1) {
        const wallet = nconf.get(`${env}:${projectId}:${wallets[i]}`);
        const choice = {
          title: wallet.name,
          description: `${wallet.name} (${wallet.address})`,
          value: wallets[i],
        };
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
   * Info Wallet.
   */
  static async infoWallet(nconf) {
    const { mintknight, walletId } = connect(nconf);
    const result = await mintknight.getWallet(walletId);
    if (!result.success) error('Error getting wallet');
    console.log(result.data);
  }

  /**
   * Add a new Contract (draft mode)
   */
  static async newContract(nconf) {
    let name2;
    let ext2;
    const { mintknight } = connect(nconf);
    const { project, wallet } = Actions.info(nconf);
    // Add contract.
    const contract = await Prompt.contract(project.name);
    if (!!contract.thumb) {
      if (!fs.existsSync(contract.thumb))
        error(`File ${contract.thumb} does not exist`);
      const { name, ext } = path.parse(contract.thumb);
      name2 = name;
      ext2 = ext;
      if (!['.png', '.jpg', '.gif', '.pdf'].includes(ext))
        error('Invalid extension. Only .png, .jpg, .gif  is valid');
    }
    // urlCode
    let urlCode = '';
    if (contract.contractType === 51 || contract.contractType === 52) {
      urlCode = await Prompt.text('Url code (landing page path)');
      if (!urlCode) error(`Url code is required`);
    }
    // baseUri
    let baseUri = '';
    if (contract.contractType === 51) {
      const _baseUri = await Prompt.text('Base URI (optional))');
      if (!!_baseUri) baseUri = _baseUri;
    }

    // Add contract
    let result = await mintknight.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      wallet.walletId,
      urlCode,
      baseUri,
      contract.thumb,
      `${name2}${ext2}`
    );
    if (!result.success) error('Error adding contract');
    const theContract = result.data;
    theContract.contractId = theContract._id;
    await Config.addContract(nconf, theContract, wallet);

    // Deploy contract?
    const choices = [
      {
        title: 'Deploy contract',
        description: 'Deploy contract into blockchain',
        value: true,
      },
      {
        title: 'Not to deploy',
        description: 'Contract remains on draft into DB',
        value: false,
      },
    ];
    const deploy = await Select.option(choices);
    if (deploy) {
      await this.deployContract(nconf);
    }
  }

  /**
   * Update Contract DB
   */
  static async updateContractDB(nconf) {
    const { env, mintknight, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const contract = nconf.get(`${env}:${projectId}:${contractId}`);
    // urlCode
    let urlCode = '';
    if (contract.type === 51 || contract.type === 52) {
      urlCode = await Prompt.text('Url code (landing page path)');
      if (!urlCode) error(`Url code is required`);
    } else {
      error('This type of contract cannot update');
      return;
    }
    const result = await mintknight.updateContractDB(contractId, {
      urlCode,
    });
    if (!result.success) error('Error adding contract');
    log('Contract updated');
  }

  /**
   * deploys a draft contract
   */
  static async deployContract(nconf) {
    const { mintknight, contractId } = connect(nconf);
    const result = await mintknight.deployContract(contractId);
    if (!result.success) error('Error deploying contract');
    const theContract = result.data.contract;
    const task = await mintknight.waitTask(result.data.taskId);
    if (task == false || (task.state && task.state.toLowerCase() == 'failed'))
      error(`Error deploying contract`);
    // Update contract
    theContract.contractId = theContract._id;
    await Config.updateContract(nconf, theContract, task.address);
  }

  /**
   * Select a Contract
   */
  static async selContract(nconf) {
    const env = nconf.get('env');
    const projectId = nconf.get(`${env}:projectId`);
    const contracts = nconf.get(`${env}:${projectId}:contracts`);
    if (contracts.length > 10) {
      warning('Only one Contract available. Already selected');
    } else {
      const choices = [];
      for (let i = 0; i < contracts.length; i += 1) {
        const contract = nconf.get(`${env}:${projectId}:${contracts[i]}`);
        if (!contract) continue;
        const choice = {
          title: contract.name,
          description: `${contract.type}`,
          value: contracts[i],
        };
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
   * Info Contract.
   */
  static async infoContract(nconf) {
    const { mintknight, contractId } = connect(nconf);
    const result = await mintknight.getContract(contractId);
    if (!result.success) error('Error getting contract');
    const contract = result.data;
    title(`\n${contract._id}`);
    if (contract) {
      warning(`${contract.name} (${contract.symbol})`);
      switch (contract.contractType) {
        case 10:
          detail('type', 'ERC20');
          break;
        case 51:
          detail('type', 'ERC721 Mutable');
          break;
        case 52:
          detail('type', 'ERC721 Immutable');
          break;
        default:
          detail('type', 'unknown');
          break;
      }
      detail('network', contract.network);
      if (!!contract.address) detail('address', contract.address);
      detail('status', contract.status);
      if (!!contract.owner) detail('owner', contract.owner);
      if (!!contract.minter) detail('minter', contract.minter);
      if (!!contract.mediaId) detail('mediaId', contract.mediaId);
      if (!!contract.urlCode) detail('urlCode', contract.urlCode);
      if (!!contract.baseUri) detail('baseUri', contract.baseUri);
      if (!!contract.blockchain) {
        detail('name', contract.blockchain.name);
        detail('symbol', contract.blockchain.symbol);
        detail('totalSupply', contract.blockchain.totalSupply);
      }
      log('\n');
    } else error('Contract not found');
  }

  /**
   * Add a new Drop
   */
  static async newDrop(nconf) {
    const { mintknight, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const {
      name,
      description,
      dropType,
      useCodes,
      isDirectMinting,
      multiplesMintingsPerAccountAndDrop,
      price,
      coin,
      startDate,
      endDate,
    } = await this.askDropParams();
    // Add drop
    const result = await mintknight.addDrop(contractId, {
      name,
      description,
      dropType,
      useCodes,
      isDirectMinting,
      multiplesMintingsPerAccountAndDrop,
      price,
      coin,
      startDate,
      endDate,
    });
    if (!result.success) error('Error creating Drop');
    log('Drop created with id: ' + result.data._id);
  }

  /**
   * Ask for drop params
   */
  static async askDropParams(operation = 'add') {
    // Name
    const name = await Prompt.text('Name');
    if (operation === 'add' && !name) error(`Name is required`);
    // Description
    const description = await Prompt.text('Description');
    if (operation === 'add' && !description) error(`Description is required`);
    var choices;
    // dropType
    choices = [
      {
        title: 'First come first Served',
        description: 'First come first Served',
        value: 'fifo',
      },
      { title: 'Raffle', description: 'Raffle', value: 'raffle' },
    ];
    const dropType = await Select.option(choices, 'Choose drop type');
    // useCodes
    choices = [
      { title: 'Yes', description: 'Drop uses codes', value: 1 },
      { title: 'No', description: 'Drop doesn´t uses codes', value: 0 },
    ];
    const useCodes = await Select.option(choices, 'Uses codes?');
    // isDirectMinting
    choices = [
      { title: 'Yes', description: 'Direct minting (Free)', value: 1 },
      { title: 'No', description: 'Not direct minting', value: 0 },
    ];
    const isDirectMinting = await Select.option(choices, 'Direct minting?');
    // multiplesMintingsPerAccountAndDrop
    choices = [
      {
        title: 'Yes',
        description: 'Multiples mintings by the same account & drop',
        value: 1,
      },
      {
        title: 'No',
        description: 'Only 1 minting per account & drop',
        value: 0,
      },
    ];
    const multiplesMintingsPerAccountAndDrop = await Select.option(
      choices,
      'Multiples mintings by the same account & drop?'
    );
    // Price
    const price = await Prompt.text('Price');
    if (operation === 'add' && !price) error(`Price is required`);
    // coin
    choices = [
      { title: 'USDC', description: 'USDC', value: 'usdc' },
      { title: 'MATIC', description: 'MATIC', value: 'matic' },
    ];
    const coin = await Select.option(choices, 'Choose the coin');
    // Start date
    const startDate = await Prompt.text('Start date (YYYY-MM-DD)');
    if (operation === 'add' && !startDate) error(`Start date is required`);
    // End date
    const endDate = await Prompt.text('End date (YYYY-MM-DD)');
    if (operation === 'add' && !endDate) error(`End date is required`);

    return {
      name,
      description,
      dropType,
      useCodes,
      isDirectMinting,
      multiplesMintingsPerAccountAndDrop,
      price,
      coin,
      startDate,
      endDate,
    };
  }

  /**
   * List Drops
   */
  static async listDrop(nconf) {
    const { mintknight, contractId, walletId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const result = await mintknight.getDrops(contractId);
    if (!result.success) error('Error getting drops');
    for (let i = 0; i < result.data.length; i += 1) {
      const obj = result.data[i];
      // console.log('obj', obj);
      title(`\nname: ${obj.name}`);
      detail('dropType', obj.dropType);
      detail('useCodes', obj.useCodes);
      detail('isDirectMinting', obj.isDirectMinting);
      detail(
        'multiplesMintingsPerAccountAndDrop',
        obj.multiplesMintingsPerAccountAndDrop
      );
      detail('price', obj.price);
      detail('coin', obj.coin);
      detail('startDate', obj.startDate);
      detail('endDate', obj.endDate);
      detail('contractId', obj.contractId);
      detail('id', obj._id);
    }
  }

  /**
   * Update Drop
   */
  static async updateDrop(nconf) {
    const { mintknight } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    const {
      name,
      description,
      dropType,
      useCodes,
      isDirectMinting,
      multiplesMintingsPerAccountAndDrop,
      price,
      coin,
      startDate,
      endDate,
    } = await this.askDropParams('update');
    // Update drop
    const result = await mintknight.updateDrop(dropId, {
      name,
      description,
      dropType,
      useCodes,
      isDirectMinting,
      multiplesMintingsPerAccountAndDrop,
      price,
      coin,
      startDate,
      endDate,
    });
    if (!result.success) error('Error updating Drop');
    log('Drop updated');
  }

  /**
   * Add a new Drop strategy
   */
  static async newDropStrategy(nconf) {
    const { mintknight } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    const { channel, actions, reference } = await this.askDropStrategyParams();
    // Add drop strategy
    const result = await mintknight.addDropStrategy(dropId, {
      channel,
      actions,
      reference,
    });
    if (!result.success) error('Error creating Drop strategy');
    log('Drop strategy created with id: ' + result.data.dropStrategy._id);
  }

  /**
   * Ask for drop strategy params
   */
  static async askDropStrategyParams(operation = 'add') {
    var choices;
    // channel
    choices = [
      { title: 'Twitter', description: 'Twitter', value: 'twitter' },
      { title: 'Telegram', description: 'Telegram', value: 'telegram' },
      { title: 'Discord', description: 'Discord', value: 'discord' },
    ];
    const channel = await Select.option(choices, 'Choose channel');
    // Actions
    const actions = await Prompt.text(
      'Actions (delimited by coma). e.g: follow,rt,like,join'
    );
    if (!actions) error(`Actions are required`);
    const reference = await Prompt.text('Reference');

    return {
      channel,
      actions,
      reference,
    };
  }

  /**
   * List Drop strategies
   */
  static async listDropStrategy(nconf) {
    const { mintknight } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    // Get drop strategies
    const result = await mintknight.getDropStrategies(dropId);
    if (!result.success) error('Error getting drop strategies');
    for (let i = 0; i < result.data.length; i += 1) {
      const obj = result.data[i];
      // console.log('obj', obj);
      title(`\nid: ${obj._id}`);
      detail('channel', obj.channel);
      detail('actions', obj.actions);
      detail('reference', obj.reference);
      detail('dropId', obj.dropId);
    }
  }

  /**
   * Update Drop strategy
   */
  static async updateDropStrategy(nconf) {
    const { mintknight } = connect(nconf);
    // dropStrategyId
    const dropStrategyId = await Prompt.text(
      'Drop strategy Id (mk list dropstrategy)'
    );
    if (!dropStrategyId) error(`Drop strategy Id is required`);
    const { channel, actions, reference } = await this.askDropStrategyParams(
      'update'
    );
    // Update drop strategies
    const result = await mintknight.updateDropStrategy(dropStrategyId, {
      channel,
      actions,
      reference,
    });
    if (!result.success) error('Error updating Drop strategy');
    log('Drop strategy updated');
  }

  /**
   * Add a new Drop code/s
   */
  static async newDropCode(nconf) {
    const { mintknight } = connect(nconf);
    const choices = [
      {
        title: 'Only one',
        description: 'Upload only one Drop code',
        value: 'one',
      },
      {
        title: 'Bulk mode',
        description: 'Upload several drop codes at the same time (csv)',
        value: 'bulk',
      },
    ];
    const option = await Select.option(choices);

    if (option === 'bulk') {
      await this.addDropCodes(nconf);
      return;
    }

    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    // Ask for other params
    const { code, maxUsage } = await this.askDropCodeParams();
    // Add drop code
    const result = await mintknight.addDropCode(dropId, {
      code,
      maxUsage,
    });
    if (!result.success) error('Error creating Drop code');
    log('Drop code created with id: ' + result.data.dropCode._id);
  }

  /**
   * Ask for drop code params
   */
  static async askDropCodeParams(operation = 'add') {
    // code
    const code = await Prompt.text('Drop code');
    if (!code) error(`Drop code is required`);
    // maxUsage
    const maxUsage = await Prompt.text('Max usage');
    if (!maxUsage || maxUsage < 1) error(`Max usage must be greater than 0`);

    return {
      code,
      maxUsage,
    };
  }

  /**
   * List Drop codes
   */
  static async listDropCode(nconf) {
    const { mintknight } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    // Get drop codes
    const result = await mintknight.getDropCodes(dropId);
    if (!result.success) error('Error getting drop codes');
    for (let i = 0; i < result.data.length; i += 1) {
      const obj = result.data[i];
      // console.log('obj', obj);
      title(`\ncode: ${obj.code}`);
      detail('maxUsage', obj.maxUsage);
      detail('actualUsage', obj.actualUsage);
      detail('dropId', obj.dropId);
      detail('id', obj._id);
    }
  }

  /**
   * Update Drop code
   */
  static async updateDropCode(nconf) {
    const { mintknight } = connect(nconf);
    // dropCodeId
    const dropCodeId = await Prompt.text('Drop code Id (mk list dropcode)');
    if (!dropCodeId) error(`Drop code Id is required`);
    const { code, maxUsage } = await this.askDropCodeParams('update');
    // Update drop code
    const result = await mintknight.updateDropCode(dropCodeId, {
      code,
      maxUsage,
    });
    if (!result.success) error('Error updating Drop code');
    log('Drop code updated');
  }

  /**
   * Upload bulk Drop codes
   */
  static async addDropCodes(nconf) {
    const { mintknight } = connect(nconf);
    // Ask for DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    // Ask CSV file
    var csvFilename = await Prompt.text('Csv file');
    // csvFilename = './assets/dropcodes.csv';
    if (!csvFilename) error('Csv file needed. e.g: ./assets/dropcodes.csv');
    if (!fs.existsSync(csvFilename))
      error(`File ${csvFilename} does not exist`);
    var { name, ext } = path.parse(csvFilename);
    if (!['.csv'].includes(ext)) error('Invalid extension. Only csv is valid');
    csvFilename = path.normalize(csvFilename);
    // Add drop codes (bulk upload method)
    const result = await mintknight.addDropCodes(dropId, csvFilename);
    if (!result.success) error('Error uploading Drop codes');
    log('Drop codes Uploaded');
  }

  /**
   * Add a new Drop user
   */
  static async newDropUser(nconf) {
    const { mintknight } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    const { name, email, twitter, telegram, discord, address } =
      await this.askDropUserParams();
    // Add drop user
    const result = await mintknight.addDropUser(dropId, {
      name,
      email,
      twitter,
      telegram,
      discord,
      address,
    });
    if (!result.success) error('Error creating Drop user');
    log('Drop user created with id: ' + result.data.dropUser._id);
  }

  /**
   * Ask for drop user params
   */
  static async askDropUserParams(operation = 'add') {
    const name = await Prompt.text('Name');
    if (!name) error(`Name is required`);
    const email = await Prompt.text('Email');
    const twitter = await Prompt.text('Twitter');
    const telegram = await Prompt.text('Telegram');
    const discord = await Prompt.text('Discord');
    const address = await Prompt.text('Address');

    return {
      name,
      email,
      twitter,
      telegram,
      discord,
      address,
    };
  }

  /**
   * List Drop users
   */
  static async listDropUser(nconf) {
    const { mintknight } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    // Get drop users
    const result = await mintknight.getDropUsers(dropId);
    if (!result.success) error('Error getting drop users');
    for (let i = 0; i < result.data.length; i += 1) {
      const obj = result.data[i];
      // console.log('obj', obj);
      title(`\nname: ${obj.name}`);
      detail('email', obj.email);
      detail('twitter', obj.twitter);
      detail('telegram', obj.telegram);
      detail('discord', obj.discord);
      detail('address', obj.address);
      detail('id', obj._id);
    }
  }

  /**
   * Add a newImage to media Lib.
   */
  static async newMedia(nconf, img = false) {
    const { mintknight } = connect(nconf);
    // Check
    if (img === false) error('Image needed. mk add media ./assets/nft.png');
    if (!fs.existsSync(img)) error(`File ${img} does not exist`);
    const { name, ext } = path.parse(img);
    if (!['.png', '.jpg', '.gif', '.txt', '.pdf', '.mp3', '.mp4'].includes(ext))
      error(
        'Invalid extension. Only .png, .jpg, .gif, .txt, .pdf, .mp3, .mp4  is valid'
      );
    // Upload into Arweave or not?
    const choices = [
      {
        title: 'Only draft',
        description: 'Save media into database',
        value: false,
      },
      {
        title: 'Upload to Arweave & save into database',
        description: 'Do you want to upload into Arweave?',
        value: true,
      },
    ];
    const uploadToArweave = await Select.option(choices);
    // Add media
    const result = await mintknight.addMedia(
      img,
      `${name}${ext}`,
      uploadToArweave
    );
    if (!result.success) error('Error adding media');
    if (uploadToArweave) {
      // Upload to arweave
      const task = await mintknight.waitTask(result.data.taskId);
      if (
        task === false ||
        (task.state && task.state.toLowerCase() === 'failed')
      )
        error('Media upload failed');
    }
    log('Media added');
  }

  /**
   * Upload media into Arweave
   */
  static async uploadMedia(nconf) {
    const { mintknight } = connect(nconf);
    // mediaId
    const mediaId = await Prompt.text('Media Id (mk list media)');
    if (!mediaId) error(`Media Id is required`);
    // Upload media
    const result = await mintknight.uploadMedia(mediaId);
    if (!result.success) error('Error uploading media');
    const task = await mintknight.waitTask(result.data.taskId);
    if (task === false || (task.state && task.state.toLowerCase() === 'failed'))
      error('Media upload failed');
    log('Media has been uploaded successfully');
  }

  /**
   * List all media files.
   */
  static async listMedia(nconf) {
    const { mintknight } = connect(nconf);
    const result = await mintknight.getMedias();
    if (!result.success) error('Error getting media');
    const media = result.data;
    if (media.length === 0) warning('No medias assigned to this project');
    for (let i = 0; i < media.length; i += 1) {
      // console.log(media[i]);
      title(`\n${media[i]._id}`);
      detail('Name', media[i].name);
      if (!!media[i].url) detail('url', media[i].url);
      if (!!media[i].fileUrl) detail('fileUrl', media[i].fileUrl);
    }
  }

  /**
   * Mint a new token
   */
  static async mintToken(nconf) {
    const { mintknight, env, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    // if (checkOwner(env, nconf) === false) error('Invalid Wallet');
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );
    const amount = await Prompt.text('Number of tokens');
    if (!amount) error(`Number of tokens is required`);

    const minterId = nconf.get(`${env}:${projectId}:walletId`);
    const minter = nconf.get(`${env}:${projectId}:${minterId}`);
    let result = await mintknight.mintToken(
      contractId,
      minterId,
      minter.skey,
      amount,
      walletId,
      address
    );
    if (!result.success) error('Error minting tokens');
    const task = await mintknight.waitTask(result.data.taskId);
    if (task == false || (task.state && task.state.toLowerCase() == 'failed')) error(`Error minting tokens`);
    log('Tokens Minted');
  }

  /**
   * Get info token (blance of address)
   */
  static async infoToken(nconf) {
    const { mintknight, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const address = await Prompt.text('Public address');
    if (!address) error('An address is required');
    const result = await mintknight.getToken(contractId, address);
    if (!result.success) error('Error getting token');
    const token = result.data;
    title(`\n${address}`);
    detail('Name', token.name);
    detail('Symbol', token.symbol);
    detail('Total Supply', token.totalSupply);
    detail('Balance Of address', token.balanceOf);
  }

  /**
   * Transfer a token
   */
  static async transferToken(nconf) {
    const { mintknight, env, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    // if (checkOwner(env, nconf) === false) error('Invalid Wallet');
    log('Send the Token To');
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );
    const amount = await Prompt.text('Number of tokens');
    if (!amount) error(`Number of tokens is required`);

    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    let result = await mintknight.transferToken(
      contractId,
      ownerId,
      owner.skey,
      amount,
      walletId,
      address
    );
    if (!result.success) error('Transfer Failed');
    const task = await mintknight.waitTask(result.data.taskId);
    if (task == false || (task.state && task.state.toLowerCase() == 'failed'))
      error(`Transfer Failed`);
    log('Token Transferred');
  }

  /**
   * Add (upload) NFT/s
   */
  static async newNFT(nconf) {
    const { mintknight, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');

    const choices = [
      {
        title: 'Only one',
        description: 'Upload only one NFT',
        value: 'one',
      },
      {
        title: 'Bulk mode',
        description: 'Upload several NFTs at the same time (csv & zip)',
        value: 'bulk',
      },
    ];
    const option = await Select.option(choices);

    if (option === 'bulk') {
      await this.addNFTs(nconf);
      return;
    }

    // Get Nft
    const nft = await Prompt.nft();
    // Check properties
    if (!nft.name) error(`Token Name is required`);
    if (!nft.description) error(`Token Description is required`);
    nft.attributes = JSON.stringify(nft.attributes);
    // Add the nft
    const result = await mintknight.addNFT(contractId, nft, nft.img, null);
    if (!result.success) error('Error uploading the NFT');
    log('NFT Uploaded');
  }

  /**
   * Upload bulk NFTs
   */
  static async addNFTs(nconf) {
    const { mintknight, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');

    /*
     * Ask CSV file
     */
    var csvFilename = await Prompt.text('Csv file');
    // csvFilename = './assets/nfts-v2.csv';
    if (!csvFilename) error('Csv file needed. e.g: ./assets/nfts-v2.csv');
    if (!fs.existsSync(csvFilename))
      error(`File ${csvFilename} does not exist`);
    var { name, ext } = path.parse(csvFilename);
    if (!['.csv'].includes(ext)) error('Invalid extension. Only csv is valid');
    csvFilename = path.normalize(csvFilename);

    /*
     * Ask Zip file
     */
    var zipFilename = await Prompt.text('Zip file');
    // zipFilename = './assets/animals.zip';
    if (!zipFilename) error('Csv file needed. e.g: ./assets/animals.zip');
    if (!fs.existsSync(zipFilename))
      error(`File ${zipFilename} does not exist`);
    var { name, ext } = path.parse(zipFilename);
    if (!['.zip'].includes(ext)) error('Invalid extension. Only zip is valid');
    zipFilename = path.normalize(zipFilename);

    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');

    const result = await mintknight.addNFTs(
      contractId,
      csvFilename,
      zipFilename,
      dropId
    );
    if (!result.success) error('Error uploading NFTs');
    log('NFTs Uploaded');
  }

  /**
   * Update a NFT
   */
  static async updateNft(nconf) {
    const { mintknight } = connect(nconf);
    const nftId = await Prompt.text('Nft Id');
    if (!nftId) error(`Nft ID is required`);
    // Get Nft
    const nft = await Prompt.nft(false);
    // Check properties
    if (!nft.tokenId) error(`Token ID is required`);
    // if (!nft.name) error(`Token Name is required`);
    // if (!nft.description) error(`Token Description is required`);
    nft.attributes = JSON.stringify(nft.attributes);
    // Update NFT
    const result = await mintknight.updateNFT(nftId, nft);
    if (!result.success) error('NFT Updated Failed');
    log('NFT Updated');
  }

  /**
   * Mint a existent NFT
   */
  static async mintNFT(nconf) {
    const { mintknight, env, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    // if (checkOwner(env, nconf) === false) error('Invalid Wallet');
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );
    const minterId = nconf.get(`${env}:${projectId}:walletId`);
    const minter = nconf.get(`${env}:${projectId}:${minterId}`);
    // Ask for NFT ID
    const nftId = await Prompt.text('NFT Id (mk list nft)');
    if (!nftId) error(`NFT Id is required`);
    // Upload metadata
    const contract = nconf.get(`${env}:${projectId}:${contractId}`);
    if (contract.type === 52) {
      const result = await mintknight.uploadMetadataNFT(nftId);
      if (!result.success) error('Upload metadata Failed');
      const task = await mintknight.waitTask(result.data.taskId);
      if (task == false || (task.state && task.state.toLowerCase() == 'failed'))
        error(`Upload metadata Failed`);
    }
    // Mint
    const result = await mintknight.mintNFT(
      nftId,
      minterId,
      minter.skey,
      walletId,
      address
    );
    if (!result.success) error('Mint Failed');
    const task = await mintknight.waitTask(result.data.taskId);
    if (task == false || (task.state && task.state.toLowerCase() == 'failed')) error(`Mint Failed`);
    log('NFT Minted');
  }

  /**
   * Transfer a NFT
   */
  static async transferNFT(nconf) {
    const { mintknight, env, projectId, contractId } = connect(nconf);
    // if (checkOwner(env, nconf) === false) error('Invalid Wallet');
    // Get metadata
    const nftId = await Prompt.text('Nft Id');
    log('Send the NFT To');
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );

    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    const result = await mintknight.transferNFT(
      nftId,
      ownerId,
      owner.skey,
      walletId,
      address
    );
    if (!result.success) error('Transfer Failed');
    const task = await mintknight.waitTask(result.data.taskId);
    if (task == false || (task.state && task.state.toLowerCase() == 'failed')) error(`Transfer Failed`);
    log('NFT Transferred');
  }

  /**
   * List NFTs.
   */
  static async listNft(nconf) {
    const { mintknight, contractId, walletId, network } = connect(nconf);

    const choices = [
      {
        title: 'Contract',
        description: 'List NFTs by the selected contract',
        value: 'contract',
      },
      {
        title: 'Wallet',
        description: 'List NFTs by the selected wallet',
        value: 'wallet',
      },
      {
        title: 'Address',
        description: 'List NFTs by address (into the real Blockchain)',
        value: 'address',
      },
    ];
    const option = await Select.option(choices);

    let result;
    if (option === 'contract') {
      if (!contractId) error('A contract must be selected');
      result = await mintknight.getNftsByContract(contractId);
    } else if (option === 'wallet') {
      if (!walletId) error('A wallet must be selected');
      result = await mintknight.getNftsByWallet(walletId);
    } else {
      const address = await Prompt.text('Address');
      if (!address) error('An Address is required');
      result = await mintknight.getAllNFTsFromBlockchain(address, {
        withMetadata: false,
        // pageKey: '',
      });
    }
    if (!result.success) error('Error uploading the NFT');

    const nfts = result.data;
    if (option === 'address') {
      console.log(nfts);
    } else {
      for (let i = 0; i < nfts.length; i += 1) {
        const nft = nfts[i];
        // console.log('nft', nft);
        title(`\n${nft.name}`);
        detail('tokenId', nft.tokenId);
        detail('nftId', nft._id);
        detail('state', nft.state);
        if (!!nft.mediaId) detail('mediaId', nft.mediaId);
        if (nft.state == 'minted') {
          detail('owner', nft.walletId);
        }
        if (!!nft.dropId) detail('dropId', nft.dropId);
        detail('metadata', nft.metadata);
        if (!!nft.uri) detail('uri', nft.uri);
      }
    }
  }

  /**
   * Metadata NFTs.
   */
  static async infoNft(nconf) {
    const { mintknight, contractId } = connect(nconf);
    const tokenId = await Prompt.text('TokenId');
    const result = await mintknight.getNft(contractId, tokenId);
    if (!result.success) error('Error getting NFT');
    const nft = result.data;
    title(`\n${nft.name}`);
    detail('Description, ', nft.description);
    detail('Image', !!nft.image ? nft.image : '');
    console.log(
      'Attributes:',
      !!nft.attributes && nft.attributes.length > 0 ? nft.attributes : []
    );
  }

  /**
   * Update Limits (only admin).
   */
  static async updateLimits(nconf) {
    const { mintknight } = connect(nconf);
    const projectId = await Prompt.text('ProjectId');
    const result = await mintknight.updateLimits(projectId);
    if (!result.success) error('Error updating limits');
    log('Limits updated');
  }

  /**
   * Update minter/owner of a contract
   */
  static async updateContract(nconf, change) {
    const { env, mintknight, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );
    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    const task = await mintknight.updateContract(
      contractId,
      change,
      walletId,
      address,
      ownerId,
      owner.skey
    );
    await waitTask(
      task,
      mintknight,
      `Failed to update ${change}`,
      `${change} updated`
    );
  }

  /**
   * Update verifier
   */
  static async updateVerifier(nconf) {
    const { env, mintknight, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const verifier = await Prompt.text('Verifier (wallet Id of a Signer)');
    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    const task = await mintknight.updateVerifier(
      contractId,
      verifier,
      ownerId,
      owner.skey
    );
    await waitTask(
      task,
      mintknight,
      'Verifier updated',
      'Failed to update verifier'
    );
  }
}

module.exports = { Actions, Config };
