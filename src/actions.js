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

class Actions {
  /**
   * Saves a user to the config
   *
   * @param {object} nconf
   * @param {object}user
   */
  static async saveUser(nconf, user) {
    user.status === 'failed' && error(user.error);
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
    nconf.set(
      `${env}:${projectId}:${wallet.walletId}:contractAddress`,
      wallet.contractAddress
    );
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
    detail('mk info project', 'Queries stats for current project');
    detail('mk select project', 'Select Selected project');
    detail('mk update project', 'update Selected project');

    title('\nWallets');
    detail('mk add wallet', 'Add a new wallet');
    detail('mk add signer', 'Add a new signer (wallet off-chain)');
    // detail('mk add eoa', 'Add a new eoa (Externally Owned Account,)');
    detail('mk info wallet', 'Queries stats for current wallet');
    detail('mk select wallet', 'Select Active wallet');

    title('\nContracts');
    detail('mk add contract', 'Add a new contract');
    detail('mk save contract', 'Add a new contract (draft)');
    detail('mk deploy contract', 'Deploys selected contract');
    detail('mk info contract', 'Queries stats for current contract');
    detail('mk select contract', 'Select Active contract');
    detail('mk update contract', 'Update the active contract');
    detail('mk list contracts', 'List all contracts from delected project');
    // detail('mk update minter', 'Update the contract´s minter');
    // detail('mk update owner', 'Update the contract´s owner');
    // detail('mk update verifier', 'Update the contract´s verifier');

    title('\nDrops');
    detail('mk add drop', 'Add a new drop');
    detail('mk list drop', 'List all Drops in the contract');
    detail('mk update drop', 'Update a drop in the contract');

    title('\nDrop strategies');
    detail('mk add dropstrategy', 'Add a new Drop strategy');
    detail('mk list dropstrategy', 'List all Drop strategies in a drop');
    detail('mk update dropstrategy', 'Update a drop strategy');

    title('\nDrop codes');
    detail('mk add dropcode', 'Add a new Drop codes (solo or bulk mode)');
    detail('mk list dropcode', 'List all Drop codes in a drop');
    detail('mk update dropcode', 'Update a drop code');

    title('\nDrop users');
    detail('mk add dropuser', 'Add a new user');
    detail('mk list dropuser', 'List all Drop users in the contract');

    title('\nNFTs');
    detail('mk add nft', 'Add news NFT/s (draft)');
    detail('mk info nft', 'Get the metadata for an NFT');
    detail('mk list nft', 'List NFTs');
    detail('mk update nft', 'Update the metadata for an NFT (draft)');
    detail('mk mint nft', 'Mint to the selected Contract');
    detail('mk transfer nft', 'Transfer an NFT owned by the current Wallet');

    title('\nMedia');
    detail('mk add media <file>', 'Add a new image to the media Library');
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
      detail('wallet', wallet.name);
    }
    if (project.contractId) {
      contract = nconf.get(`${env}:${project.projectId}:${project.contractId}`);
      contract.contractId = project.contractId;
      detail('contract', contract.name);
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
    await Actions.saveUser(nconf, config);

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
    await Actions.addProject(nconf, project);
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

    console.log('project', project);

    //agafar el nom
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
    console.log('result', result);

    if (result.status === 'failed') error(result.error);
    project.projectId = result._id;

    // Get Token.
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.token;
    await Actions.addProject(nconf, project);
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

    // Add project.
    const project = await Prompt.project(nconf.get('env'));

    //agafar el nom
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
    console.log('result', result);

    if (result.status === 'failed') error(result.error);
    project.projectId = result._id;

    // Get Token.
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.token;
    // await Actions.addProject(nconf, project);
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
    const nft = await mintknight.getProject();
    console.log(nft);
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
    let deployWalletRet = await mintknight.deployWallet(walletId);
    if (!deployWalletRet.success) error('Error adding wallet');
    if (!!deployWalletRet.data.taskId) {
      const task = await mintknight.waitTask(deployWalletRet.data.taskId);
      if (task.state === 'failed') error('Wallet creation failed');
      wallet.address = task.contractAddress;
    }
    await Actions.addWallet(nconf, wallet);
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
    const wallet = await mintknight.getWallet(walletId);
    console.log(wallet);
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
    let baseUri = null;
    if (contract.contractType === 51) {
      const _baseUri = await Prompt.text('Base URI (optional))');
      if (!!_baseUri) baseUri = _baseUri;
    }

    let res = await mintknight.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      wallet.walletId,
      urlCode,
      baseUri,
      contract.thumb,
      `${name2}${ext2}`
    );
    if (!res || (res.status && res.status.toLowerCase() === 'failed')) {
      error(`Error adding contract`);
    }
    res.contract.contractId = res.contract._id;
    await Actions.addContract(nconf, res.contract, wallet);
  }

  /**
   * deploys a draft contract
   */
  static async deployContract(nconf) {
    const { mintknight, contractId } = connect(nconf);
    let task = await mintknight.deployContract(contractId);
    task = await mintknight.waitTask(task.taskId);
    console.log('task', task);
    if (task == false || task.state == 'failed') {
      error(`Error deploying contract`);
    }
    // Update contract
    const env = nconf.get('env');
    const projectId = nconf.get(`${env}:projectId`);
    console.log('projectId', projectId, contractId);
    nconf.set(
      `${env}:${projectId}:${contractId}:address`,
      task.contractAddress
    );
    nconf.save();
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
          description: `${contract.name}`,
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
    const contract = await mintknight.getContract(contractId);
    if (contract) {
      warning(`\n${contract.name} (${contract.symbol})`);
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
        case 53:
          detail('type', 'ERC721 Immutable');
          break;
        case 100:
          detail('type', 'BUY Contract');
          break;
        default:
          detail('type', 'unknown');
          break;
      }
      detail('network', contract.network);
      if (!!contract.owner) detail('owner', contract.owner);
      if (!!contract.minter) detail('minter', contract.minter);
      if (contract.mediaId) {
        detail('mediaId', contract.mediaId);
      }
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
      price,
      coin,
      startDate,
      endDate,
    } = await this.askDropParams();

    const ret = await mintknight.addDrop(contractId, {
      name,
      description,
      dropType,
      useCodes,
      isDirectMinting,
      price,
      coin,
      startDate,
      endDate,
    });
    if (ret === false) error('Error creating Drop');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error creating Drop: ' + ret.error);
    log('Drop created with id: ' + ret._id);
  }

  /**
   * Ask for drop params
   */
  static async askDropParams(operation = 'add') {
    // Name
    const name = await Prompt.text('Name');
    if (!name) error(`Name is required`);
    // Description
    const description = await Prompt.text('Description');
    if (!description) error(`Description is required`);
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
    // Price
    const price = await Prompt.text('Price');
    if (!price) error(`Price is required`);
    // coin
    choices = [
      { title: 'USDC', description: 'USDC', value: 'usdc' },
      { title: 'MATIC', description: 'MATIC', value: 'matic' },
      { title: 'WETH', description: 'WETH', value: 'weth' },
      { title: 'EUR', description: 'EUR (€)', value: 'eur' },
    ];
    const coin = await Select.option(choices, 'Choose the coin');
    // Start date
    const startDate = await Prompt.text('Start date (YYYY-MM-DD)');
    if (!startDate) error(`Start date is required`);
    // End date
    const endDate = await Prompt.text('End date (YYYY-MM-DD)');
    if (!endDate) error(`End date is required`);

    return {
      name,
      description,
      dropType,
      useCodes,
      isDirectMinting,
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
    const data = await mintknight.getDrops(contractId);
    for (let i = 0; i < data.length; i += 1) {
      const obj = data[i];
      // console.log('obj', obj);
      title(`\nname: ${obj.name}`);
      detail('dropType', obj.dropType);
      detail('useCodes', obj.useCodes);
      detail('isDirectMinting', obj.isDirectMinting);
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
      price,
      coin,
      startDate,
      endDate,
    } = await this.askDropParams('update');

    const ret = await mintknight.updateDrop(dropId, {
      name,
      description,
      dropType,
      useCodes,
      isDirectMinting,
      price,
      coin,
      startDate,
      endDate,
    });
    if (ret === false) error('Error updating Drop');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error updating Drop: ' + ret.error);
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

    const ret = await mintknight.addDropStrategy(dropId, {
      channel,
      actions,
      reference,
    });
    if (ret === false) error('Error creating Drop strategy');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error creating Drop strategy: ' + ret.error);
    log('Drop strategy created with id: ' + ret.dropStrategy._id);
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
    const data = await mintknight.getDropStrategies(dropId);
    for (let i = 0; i < data.length; i += 1) {
      const obj = data[i];
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

    const ret = await mintknight.updateDropStrategy(dropStrategyId, {
      channel,
      actions,
      reference,
    });

    if (ret === false) error('Error updating Drop strategy');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error updating Drop strategy: ' + ret.error);
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

    const { code, maxUsage } = await this.askDropCodeParams();

    const ret = await mintknight.addDropCode(dropId, {
      code,
      maxUsage,
    });
    if (ret === false) error('Error creating Drop code');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error creating Drop code: ' + ret.error);
    log('Drop code created with id: ' + ret.dropCode._id);
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
    const data = await mintknight.getDropCodes(dropId);
    for (let i = 0; i < data.length; i += 1) {
      const obj = data[i];
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

    const ret = await mintknight.updateDropCode(dropCodeId, {
      code,
      maxUsage,
    });

    if (ret === false) error('Error updating Drop code');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error updating Drop code: ' + ret.error);
    log('Drop code updated');
  }

  /**
   * Upload bulk Drop codes
   */
  static async addDropCodes(nconf) {
    const { mintknight } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);

    /*
     * Ask CSV file
     */
    var csvFilename = await Prompt.text('Csv file');
    // csvFilename = './assets/dropcodes.csv';
    if (!csvFilename) error('Csv file needed. e.g: ./assets/dropcodes.csv');
    if (!fs.existsSync(csvFilename))
      error(`File ${csvFilename} does not exist`);
    var { name, ext } = path.parse(csvFilename);
    if (!['.csv'].includes(ext)) error('Invalid extension. Only csv is valid');
    csvFilename = path.normalize(csvFilename);

    const ret = await mintknight.addDropCodes(dropId, csvFilename);
    if (ret === false) error('Error uploading Drop codes');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error uploading Drop codes: ' + ret.error);
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

    const ret = await mintknight.addDropUser(dropId, {
      name,
      email,
      twitter,
      telegram,
      discord,
      address,
    });
    if (ret === false) error('Error creating Drop user');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error creating Drop user: ' + ret.error);
    log('Drop user created with id: ' + ret.dropUser._id);
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
   * List Collections
   */
  static async listCollections(nconf) {
    const { mintknight } = connect(nconf);

    const collections = await mintknight.getMedia();
    for (let i = 0; i < media.length; i += 1) {
      // console.log(media[i]);
      title(`\n${media[i]._id}`);
      detail('Name', media[i].name);
      if (!!media[i].url) detail('url', media[i].url);
      if (!!media[i].fileUrl) detail('fileUrl', media[i].fileUrl);
    }
  }

  /**
   * List Drop users
   */
  static async listDropUser(nconf) {
    const { mintknight } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    const data = await mintknight.getDropUsers(dropId);
    for (let i = 0; i < data.length; i += 1) {
      const obj = data[i];
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

    if (img === 'test') {
      let task = await mintknight.addTestMedia();
      log('Test Media added');
    } else {
      if (!fs.existsSync(img)) error(`File ${img} does not exist`);
      const { name, ext } = path.parse(img);

      if (
        !['.png', '.jpg', '.gif', '.txt', '.pdf', '.mp3', '.mp4'].includes(ext)
      )
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

      // Connect
      let ret = await mintknight.addMedia(img, `${name}${ext}`, uploadToArweave);
      if (
        ret === false ||
        (ret.status && ret.status.toLowerCase() === 'failed')
      )
        error('Media added failed');
      if (uploadToArweave) {
        const task = await mintknight.waitTask(ret.taskId);
        if (
          task === false ||
          (task.state && task.state.toLowerCase() === 'failed')
        )
          error('Media upload failed');
      }
      log('Media added');
    }
  }

  /**
   * List all media files.
   */
  static async listMedia(nconf) {
    const { mintknight } = connect(nconf);
    const media = await mintknight.getMedia();
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
    let task = await mintknight.mintToken(
      contractId,
      minterId,
      minter.skey,
      amount,
      walletId,
      address
    );
    task = await mintknight.waitTask(task.taskId);
    if (task.state === 'failed') error('Mint failed');
    log('Tokens Minted');
  }

  /**
   * Get info token (blance of address)
   */
  static async infoToken(nconf) {
    const { mintknight, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const address = await Prompt.text('Public address');
    const token = await mintknight.getToken(contractId, address);
    if (token === false) return;
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
    let task = await mintknight.transferToken(
      contractId,
      ownerId,
      owner.skey,
      amount,
      walletId,
      address
    );
    if (task == false) error('Transfer Failed');
    task = await mintknight.waitTask(task.taskId);
    if (task.state === 'failed') error('Transfer failed');
    log('Token Transferred');
  }

  /**
   * Mint a new NFT
   */
  static async mintNFT(nconf) {
    const { mintknight, env, projectId, contractId } = connect(nconf);
    // if (checkOwner(env, nconf) === false) error('Invalid Wallet');
    // Get metadata
    const nft = await Prompt.nft();
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );

    let task;
    nft.attributes = JSON.stringify(nft.attributes);
    console.log('nft', nft);
    let theNft = await mintknight.addNFT(contractId, nft);
    console.log('theNft', theNft);
    if (theNft === false) error('Error uploading the NFT');
    if (theNft.state === 'failed') error('Failed to upload NFT');
    const nftId = theNft._id;

    const minterId = nconf.get(`${env}:${projectId}:walletId`);
    const minter = nconf.get(`${env}:${projectId}:${minterId}`);
    task = await mintknight.mintNFT(
      nftId,
      minterId,
      minter.skey,
      walletId,
      address
    );
    task = await mintknight.waitTask(task.taskId);
    if (task.state === 'failed') error('Mint failed');
    log('NFT Minted');
  }

  /**
   * Transfer a NFT
   */
  static async transferNFT(nconf) {
    const { mintknight, env, projectId, contractId } = connect(nconf);
    // if (checkOwner(env, nconf) === false) error('Invalid Wallet');
    // Get metadata
    const nftId = await Prompt.text('NftId');
    log('Send the NFT To');
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );

    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    let task = await mintknight.transferNFT(
      nftId,
      ownerId,
      owner.skey,
      walletId,
      address
    );
    if (task == false) error('Transfer Failed');
    task = await mintknight.waitTask(task.taskId);
    if (task.state === 'failed') error('Transfer failed');
    log('NFT Transferred');
  }

  /**
   * Update NFT metadata
   */
  static async updateNft(nconf) {
    const { mintknight, contractId } = connect(nconf);
    const tokenId = await Prompt.text('TokenId');
    const attributes = [];
    let attribute = true;
    while (attribute !== false) {
      attribute = await Prompt.attribute();
      if (attribute !== false) attributes.push(attribute);
    }
    await mintknight.updateNFT(contractId, tokenId, attributes);
    log('NFT Updated');
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

    // Ask image
    var img = null;
    img = await Prompt.text('Image file. e.g: ./assets/nft.png');
    // img = './assets/nft.png';
    //if (!img) error('Image needed. e.g: ./assets/nft.png');
    //if (!fs.existsSync(img)) error(`File ${img} does not exist`);
    // Ask tokenId
    const tokenId = await Prompt.text('Token ID');
    //if (!tokenId) error(`Token ID is required`);

    // Ask name
    const name = await Prompt.text('Token Name');
    if (!name) error(`Token Name is required`);
    // Ask description
    const description = await Prompt.text('Token Description');
    if (!description) error(`Token Description is required`);
    // Ask price
    const price = await Prompt.text('Price');
    // Ask coin
    const coin = await Prompt.text('Coin');
    // Ask attributes
    const attributes = [];
    let attribute = true;
    while (attribute !== false) {
      attribute = await Prompt.attribute();
      if (attribute !== false) attributes.push(attribute);
    }
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');

    const ret = await mintknight.addNFT(
      contractId,
      {
        tokenId,
        name,
        description,
        price,
        coin,
        attributes: JSON.stringify(attributes),
        dropId,
      },
      img,
      null
    );
    if (ret === false) error('Error uploading the NFT');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error uploading the NFT: ' + ret.error);
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
    // const dropId = '6284c910e904ba4c55fb5347';

    const ret = await mintknight.addNFTs(
      contractId,
      csvFilename,
      zipFilename,
      dropId
    );
    if (ret === false) error('Error uploading NFTs');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error uploading NFTs' + (!!ret.error ? ': ' + ret.error : ''));
    log('NFTs Uploaded');
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

    var nfts;
    if (option === 'contract') {
      if (!contractId) error('A contract must be selected');
      nfts = await mintknight.getNfts(contractId);
    } else if (option === 'wallet') {
      if (!walletId) error('A wallet must be selected');
      nfts = await mintknight.getNftsByWallet(walletId);
    } else {
      const address = await Prompt.text('Address');
      if (!address) error('An Address is required');
      nfts = await mintknight.getAllNFTsFromBlockchain(address, {
        withMetadata: false,
        // pageKey: '',
      });
    }

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
        detail('mediaId', nft.mediaId);
        if (nft.state == 'minted') {
          detail('owner', nft.walletId);
        }
        if (!!nft.dropId) detail('dropId', nft.dropId);
      }
    }
  }

  /**
   * Metadata NFTs.
   */
  static async infoNft(nconf) {
    const { mintknight, contractId } = connect(nconf);
    const tokenId = await Prompt.text('TokenId');
    const nft = await mintknight.getNft(contractId, tokenId);
    title(`\n${nft.name}`);
    detail('Description, ', nft.description);
    detail('Image', nft.image);
    if (nft.attributes) log(nft.attributes);
  }

  /**
   * Update Limits (only admin).
   */
  static async updateLimits(nconf) {
    const { mintknight } = connect(nconf);
    const projectId = await Prompt.text('ProjectId');
    const limits = await mintknight.updateLimits(projectId);
    log(limits);
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
    const ret = await mintknight.updateContractDB(contractId, {
      urlCode,
    });
    if (ret === false) error('Error updating Contract');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error updating Contract: ' + ret.error);
    log('Contract updated');
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

  /**
   * Update minter/owner of a contract
   */
  static async updatePrices(nconf) {
    const { env, mintknight, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    let prices = await Prompt.text('Prices (separated by coma)');
    prices = prices.replace(/\s+/g, '');
    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    const task = await mintknight.updatePrices(
      contractId,
      prices,
      ownerId,
      owner.skey
    );
    await waitTask(
      task,
      mintknight,
      'Prices updated',
      'Failed to update prices'
    );
  }

  /**
   * Sign to buy a tokenId.
   */
  static async sign(nconf) {
    const { env, mintknight, projectId, contractId } = connect(nconf);
    const signerId = nconf.get(`${env}:${projectId}:walletId`);
    const signer = nconf.get(`${env}:${projectId}:${signerId}`);
    const tokenId = await Prompt.text('TokenId');
    const buyer = await Prompt.text('Buyer address');
    const signature = await mintknight.getSignature(
      contractId,
      tokenId,
      buyer,
      signerId,
      signer.skey
    );
    log('Signature', signature);
  }
}

/**
 * Logout action
 *
 * @param {string} nconf
 */
/*
  const logout = async (nconf) => {
  const {token, mintknight} = connect(nconf)
  (token === false) && error('Not logged in')
  const env = nconf.get('env')
  nconf.set(`${env}:token`, false)
  nconf.save()
  log('Logout succesful')
}
*/

/**
 * Login action
 *
 * @param {string} nconf
 */
/*
  const login = async (nconf) => {
  const {token, mintknight} = connect(nconf)
  (token !== false) && error('Already logged in. Logout first (mk logout)')
  const user = await Prompt.user('Login')
  let result = await mintknight.loginUser(user.email, user.password)
  nconf.set('user:token', result.token)
  nconf.save()
  log('Login succesful')
}
*/

module.exports = { Actions };
