const fs = require('fs');
const path = require('path');
const { Prompt, Select } = require('./term');
const { log, title, error, warning, detail } = require('./term');
const { MintKnight, MintKnightWeb } = require('../src/index');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

/**
 * Add the conf dir if it does not exists
 */
const addConfDir = async () => {
  if (!fs.existsSync(HOMEMK)) {
    await fs.promises.mkdir(HOMEMK);
  }
};

const waitTask = async (task, service, msgOk, msgKo) => {
  if (task === false) error(msgKo);
  const result = await service.waitTask(task.taskId);
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
  let urlWeb;
  let urlService;
  let contractId = false;
  let walletId = false;
  const env = nconf.get('env');
  switch (env) {
    case 'local':
      urlWeb = 'http://localhost:3000/';
      urlService = 'http://localhost:3001/';
      break;
    case 'sandbox':
      urlWeb = 'https://webapi.sandbox.mintknight.com/';
      urlService = 'https://webapi.sandbox.mintknight.com/';
      break;
    case 'production':
      urlWeb = 'https://webapi.mintknight.com/';
      urlService = 'https://api.mintknight.com/';
      break;
  }
  let service = false;
  const token = nconf.get(`${env}:token`) || false;
  const props = {
    debug: nconf.get('debug') || true,
    token,
  };
  const projectId = nconf.get(`${env}:projectId`);
  const mintknight = new MintKnightWeb(urlWeb, props);
  if (projectId) {
    walletId = nconf.get(`${env}:${projectId}:walletId`);
    contractId = nconf.get(`${env}:${projectId}:contractId`);
    props.apiKey = nconf.get(`${env}:${projectId}:token`);
    service = new MintKnight(urlService, props, env, projectId, contractId);
  }
  return { token, mintknight, service, env, contractId, projectId, walletId };
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
    detail('mk select project', 'Select Active project');

    title('\nWallets');
    detail('mk add wallet', 'Add a new wallet');
    detail('mk add signer', 'Add a new signer (wallet off-chain)');
    detail('mk select wallet', 'Select Active wallet');

    title('\nContracts');
    detail('mk add contract', 'Add a new contract');
    detail('mk select contract', 'Select Active contract');

    title('\nDrops');
    detail('mk add drop', 'Add a new drop');
    detail('mk list drop', 'List all Drops in the contract');
    detail('mk update drop', 'Update a drop in the contract');

    title('\nDrop strategies');
    detail('mk add dropstrategy', 'Add a new Drop strategy');
    detail('mk list dropstrategy', 'List all Drop strategies in a drop');
    detail('mk update dropstrategy', 'Update a drop strategy');

    title('\nDrop codes');
    detail('mk add dropcode', 'Add a new Drop code');
    detail('mk list dropcode', 'List all Drop codes in a drop');
    detail('mk update dropcode', 'Update a drop code');
    detail('mk upload-bulk dropcode', 'Upload bulk drop codes');

    title('\nNFTs');
    detail('mk mint', 'Mint to the selected Contract');
    detail('mk transfer', 'Transfer an NFT owned by the current Wallet');
    detail('mk info nft', 'Get the metadata for an NFT');
    detail('mk list nft', 'List all NFTs in the contract');
    detail('mk update nft', 'Update the metadata for an NFT');
    detail('mk upload-bulk nft', 'Upload bulk NFTs');

    title('\nMedia');
    detail('mk add media <file>', 'Add a new image to the media Library');
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
    const config = await mintknight.registerUser(user.email, user.password);
    if (config === false) error('Error while registering the user');
    if (config.status === 'failed') error(config.error);

    // Register company.
    warning('\nCompany and Project');
    const name = await Prompt.text('Name of the Company');
    let result = await mintknight.setCompany(name);
    config.companyId = result._id;
    await Actions.saveUser(nconf, config);

    // Add project.
    const project = await Prompt.project(env);
    result = await mintknight.addProject(project.name, project.network);
    project.projectId = result._id;

    // Get Token.
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.token;
    await Actions.addProject(nconf, project);
  }

  /**
   * Add a new Project
   */
  static async newProject(nconf) {
    const { mintknight } = connect(nconf);

    // Add project.
    const project = await Prompt.project(nconf.get('env'));
    let result = await mintknight.addProject(project.name, project.network);
    if (result.status === 'failed') error(result.error);
    project.projectId = result._id;

    // Get Token.
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.token;
    await Actions.addProject(nconf, project);
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
    const { service } = connect(nconf);
    const { project } = Actions.info(nconf);

    // Add wallet.
    const wallet = await Prompt.wallet(project.name);
    let task = await service.addWallet(wallet.refUser, walletType);
    if (task !== false) {
      wallet.walletId = task.wallet._id;
      wallet.skey = task.skey1;
      if (task.taskId === 0) {
        wallet.address = task.wallet.address;
      } else {
        task = await service.waitTask(task.taskId);
        wallet.address = task.contractAddress;
      }
      if (task.state === 'failed') error('Wallet creation failed');
      else await Actions.addWallet(nconf, wallet);
    }
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
    const { service, walletId } = connect(nconf);
    const wallet = await service.getWallet(walletId);
    console.log(wallet);
  }

  /**
   * Add a new Contract
   */
  static async newContract(nconf) {
    const { service } = connect(nconf);
    const { project, wallet } = Actions.info(nconf);
    // Add contract.
    const contract = await Prompt.contract(project.name);
    let task = await service.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      wallet.walletId,
      contract.contractId,
      contract.mediaId
    );
    task = await service.waitTask(task.taskId);
    if (task == false || task.state == 'failed') {
      error(`Error creating contract`);
    } else {
      contract.address = task.contractAddress;
      contract.contractId = task.contractId;
      await Actions.addContract(nconf, contract, wallet);
    }
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
      for (let i = 0; i < contracts.length; i += 1) {
        const contract = nconf.get(`${env}:${projectId}:${contracts[i]}`);
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
    const { service, contractId } = connect(nconf);
    const contract = await service.getContract(contractId);
    if (contract) {
      warning(`\n${contract.name} (${contract.symbol})`);
      switch (contract.contractType) {
        case 0:
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
      detail('owner', contract.owner);
      detail('minter', contract.minter);
      if (contract.mediaId) {
        detail('mediaId', contract.mediaId);
      }
      log('\n');
    } else error('Contract not found');
  }

  /**
   * Add a new Drop
   */
  static async newDrop(nconf) {
    const { service, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const {
      name,
      dropType,
      useCodes,
      isDirectMinting,
      price,
      coin,
      startDate,
      endDate,
    } = await this.askDropParams();

    const ret = await service.addDrop(contractId, {
      name,
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
    log('Drop created with id: ' + ret.drop._id);
  }

  /**
   * Ask for drop params
   */
  static async askDropParams(operation = 'add') {
    // Name
    const name = await Prompt.text('Name');
    if (!name) error(`Name is required`);
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
    const { service, contractId, walletId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const data = await service.getDrops(contractId);
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
      detail('id', obj._id);
    }
  }

  /**
   * Update Drop
   */
  static async updateDrop(nconf) {
    const { service } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    const {
      name,
      dropType,
      useCodes,
      isDirectMinting,
      price,
      coin,
      startDate,
      endDate,
    } = await this.askDropParams('update');

    const ret = await service.updateDrop(dropId, {
      name,
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
    const { service } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    const { channel, actions, reference } = await this.askDropStrategyParams();

    const ret = await service.addDropStrategy(dropId, {
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
    const { service } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    const data = await service.getDropStrategies(dropId);
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
    const { service } = connect(nconf);
    // dropStrategyId
    const dropStrategyId = await Prompt.text(
      'Drop strategy Id (mk list dropstrategy)'
    );
    if (!dropStrategyId) error(`Drop strategy Id is required`);
    const { channel, actions, reference } = await this.askDropStrategyParams(
      'update'
    );

    const ret = await service.updateDropStrategy(dropStrategyId, {
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
   * Add a new Drop code
   */
  static async newDropCode(nconf) {
    const { service } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);

    const { code, maxUsage } = await this.askDropCodeParams();

    const ret = await service.addDropCode(dropId, {
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
    const { service } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);
    const data = await service.getDropCodes(dropId);
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
    const { service } = connect(nconf);
    // dropCodeId
    const dropCodeId = await Prompt.text('Drop code Id (mk list dropcode)');
    if (!dropCodeId) error(`Drop code Id is required`);
    const { code, maxUsage } = await this.askDropCodeParams('update');

    const ret = await service.updateDropCode(dropCodeId, {
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
  static async uploadBulkDropCodes(nconf) {
    const { service } = connect(nconf);
    // DropId
    const dropId = await Prompt.text('Drop Id (mk list drop)');
    if (!dropId) error(`Drop Id is required`);

    /*
     * Ask CSV file
     */
    var csvFilename = await Prompt.text('Csv file');
    csvFilename = './assets/dropcodes-bulkdata1.csv';
    if (!csvFilename)
      error('Csv file needed. e.g: ./assets/dropcodes-bulkdata1.csv');
    if (!fs.existsSync(csvFilename))
      error(`File ${csvFilename} does not exist`);
    var { name, ext } = path.parse(csvFilename);
    if (!['.csv'].includes(ext)) error('Invalid extension. Only csv is valid');
    csvFilename = path.normalize(csvFilename);

    const ret = await service.uploadBulkDropCodes(dropId, csvFilename);
    if (ret === false) error('Error uploading Drop codes');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error uploading Drop codes: ' + ret.error);
    log('Drop codes Uploaded');
  }

  /**
   * Add a newImage to media Lib.
   */
  static async newMedia(nconf, img = false) {
    const { service } = connect(nconf);
    // Check
    if (img === false) error('Image needed. mk add media ./assets/nft.png');

    if (img === 'test') {
      let task = await service.addTestMedia();
      log('Test Media added');
    } else {
      if (!fs.existsSync(img)) error(`File ${img} does not exist`);
      const { name, ext } = path.parse(img);
      if (!['.png'].includes(ext))
        error('Invalid extension. Only png is valid');

      // Connect
      let task = await service.addMedia(img, `${name}${ext}`);
      task = await service.waitTask(task.taskId);
      if (task.state === 'failed') error('Media upload failed');
      else log('Media added');
    }
  }

  /**
   * List all media files.
   */
  static async listMedia(nconf) {
    const { service } = connect(nconf);
    const media = await service.getMedia();
    for (let i = 0; i < media.length; i += 1) {
      title(`\n${media[i]._id}`);
      detail(media[i].name, media[i].url);
    }
  }

  /**
   * Mint a new NFT/Token
   */
  static async mint(nconf) {
    const { service, env, projectId, contractId } = connect(nconf);
    if (checkOwner(env, nconf) === false) error('Invalid Wallet');
    // Get metadata
    const nft = await Prompt.nft();
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );
    let task = await service.saveNFT(contractId, nft);
    const nftId = task.nft._id;
    if (task.state === 'failed') error('Failed to upload NFT');
    if (task.taskId !== 0) {
      task = await service.waitTask(task.taskId);
    }
    const minterId = nconf.get(`${env}:${projectId}:walletId`);
    const minter = nconf.get(`${env}:${projectId}:${minterId}`);
    task = await service.mintNFT(
      nftId,
      minterId,
      minter.skey,
      walletId,
      address
    );
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Mint failed');
    log('NFT Minted');
  }

  /**
   * Transfer a NFT
   */
  static async transfer(nconf) {
    const { service, env, projectId, contractId } = connect(nconf);
    if (checkOwner(env, nconf) === false) error('Invalid Wallet');
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
    let task = await service.transferNFT(
      nftId,
      ownerId,
      owner.skey,
      walletId,
      address
    );
    if (task == false) error('Transfer Failed');
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Transfer failed');
    log('NFT Transferred');
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
      if (attribute !== false) attributes.push(attribute);
    }
    await service.updateNFT(contractId, tokenId, attributes);
    log('NFT Updated');
  }

  /**
   * Upload bulk NFTs
   */
  static async uploadBulkNFTs(nconf) {
    const { service, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');

    /*
     * Ask CSV file
     */
    var csvFilename = await Prompt.text('Csv file');
    //csvFilename = './assets/nft-bulkdata2.csv';
    if (!csvFilename) error('Csv file needed. e.g: ./assets/nft-bulkdata1.csv');
    if (!fs.existsSync(csvFilename))
      error(`File ${csvFilename} does not exist`);
    var { name, ext } = path.parse(csvFilename);
    if (!['.csv'].includes(ext)) error('Invalid extension. Only csv is valid');
    csvFilename = path.normalize(csvFilename);

    /*
     * Ask Zip file
     */
    var zipFilename = await Prompt.text('Zip file');
    //zipFilename = './assets/animals.zip';
    if (!zipFilename) error('Csv file needed. e.g: ./assets/animals.zip');
    if (!fs.existsSync(zipFilename))
      error(`File ${zipFilename} does not exist`);
    var { name, ext } = path.parse(zipFilename);
    if (!['.zip'].includes(ext)) error('Invalid extension. Only zip is valid');
    zipFilename = path.normalize(zipFilename);

    const ret = await service.uploadBulkNFTs(
      contractId,
      csvFilename,
      zipFilename
    );
    if (ret === false) error('Error uploading NFTs');
    if (ret.status && ret.status.toLowerCase() === 'failed')
      error('Error uploading NFTs: ' + ret.error);
    log('NFTs Uploaded');
  }

  /**
   * List NFTs.
   */
  static async listNft(nconf) {
    const { service, contractId, walletId } = connect(nconf);

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
    ];
    const option = await Select.option(choices);

    var nfts;
    if (option === 'contract') {
      if (!contractId) error('A contract must be selected');
      nfts = await service.getNfts(contractId);
    } else {
      if (!walletId) error('A wallet must be selected');
      nfts = await service.getNftsByWallet(walletId);
    }

    for (let i = 0; i < nfts.length; i += 1) {
      const nft = nfts[i];
      //console.log('nft', nft);
      title(`\n${nft.name}`);
      detail('tokenId', nft.tokenId);
      detail('nftId', nft._id);
      detail('state', nft.state);
      detail('uploaded', nft.uploaded);
      if (nft.uploaded) {
        if (nft.state == 'draft') {
          const metadata = JSON.parse(nft.metadata);
          detail('image', metadata.image);
        } else {
          detail('mediaId', nft.mediaId);
          detail('owner', nft.walletId);
        }
      } else {
        detail('mediaId', nft.mediaId);
        detail('owner', nft.walletId);
      }
    }
  }

  /**
   * Metadata NFTs.
   */
  static async infoNft(nconf) {
    const { service, contractId } = connect(nconf);
    const tokenId = await Prompt.text('TokenId');
    const nft = await service.getNft(contractId, tokenId);
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
    const { env, service, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const { walletId, address } = await Prompt.getWalletId(
      nconf,
      env,
      projectId
    );
    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    const task = await service.updateContract(
      contractId,
      change,
      walletId,
      address,
      ownerId,
      owner.skey
    );
    await waitTask(task, service, 'Failed to update owner', 'Owner updated');
  }

  /**
   * Update verifier
   */
  static async updateVerifier(nconf) {
    const { env, service, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    const verifier = await Prompt.text('Verifier (wallet Id of a Signer)');
    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    const task = await service.updateVerifier(
      contractId,
      verifier,
      ownerId,
      owner.skey
    );
    await waitTask(task, service, 'Verifier updated', 'Failed to update verifier');
  }

  /**
   * Update minter/owner of a contract
   */
  static async updatePrices(nconf) {
    const { env, service, projectId, contractId } = connect(nconf);
    if (!contractId) error('A contract must be selected');
    let prices = await Prompt.text('Prices (separated by coma)');
    prices = prices.replace(/\s+/g, '');
    const ownerId = nconf.get(`${env}:${projectId}:walletId`);
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    const task = await service.updatePrices(
      contractId,
      prices,
      ownerId,
      owner.skey
    );
    await waitTask(task, service, 'Prices updated', 'Failed to update prices');
  }

  /**
   * Sign to buy a tokenId.
   */
  static async sign(nconf) {
    const { env, service, projectId, contractId } = connect(nconf);
    const signerId = nconf.get(`${env}:${projectId}:walletId`);
    const signer = nconf.get(`${env}:${projectId}:${signerId}`);
    const tokenId = await Prompt.text('TokenId');
    const buyer = await Prompt.text('Buyer address');
    const signature = await service.getSignature(
      contractId,
      tokenId,
      buyer,
      signerId,
      signer.skey,
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
