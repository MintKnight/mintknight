const fs = require('fs');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';
const { log, title, error, warning, detail, check } = require('./term');
const { MintKnight, MintKnightWeb } = require('../src/index');
const { Actions } = require('./actions');

function makeid(length) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

class Test {
  /**
   * Toggle debug value
   */

  static async go(nconf) {
    // Setup connection to Mintknight - Web.
    const props = {
      debug: false,
      token: false,
    };
    const urlWeb = 'http://localhost:5000/';
    let mintknight = new MintKnightWeb(urlWeb, props);

    warning('\nTest - User Registration\n');
    const env = 'local';
    nconf.set('env', env);
    nconf.save();

    // SETUP USER.
    const config = await mintknight.registerUser(
      `${makeid(10)}$mk.com`,
      'testpassword'
    );
    if (config === false) error('Error while registering the user');
    if (config.status === 'failed') error(config.error);
    check('User registered');

    props.token = config.token;
    mintknight = new MintKnightWeb(urlWeb, props);

    // Register company.
    let result = await mintknight.setCompany('NFT Org');
    config.companyId = result._id;
    await Actions.saveUser(nconf, config);
    check('Company added');

    // Add project.
    const project = {
      name: 'NFT Project',
      network: 'localhost',
    };
    result = await mintknight.addProject(project.name, project.network);
    project.projectId = result._id;
    check('Project added');

    // Get Token.
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.token;
    await Actions.addProject(nconf, project);
    check('Got API KEY');

    warning('\nTest - Deploy NFT Contract\n');
    const urlService = 'http://localhost:5001/';
    props.apiKey = project.token;
    let service = new MintKnight(
      urlService,
      props,
      'local',
      project.projectId,
      false
    );

    // Add wallet : Signer
    let task = await service.addWallet('ref3', 'signer');
    if (task === false) error('Failed to deploy a Wallet');
    const signer = {
      name: 'signer',
      walletId: task.wallet._id,
      skey: task.skey1,
      address: task.wallet.address,
    };
    await Actions.addWallet(nconf, signer);
    check('Signer deployed');
    //
    // Add wallet : NFT Owner
    task = await service.addWallet('ref2', 'onchain');
    if (task === false) error('Failed to deploy a Wallet');
    const nftowner = {
      name: 'nftowner',
      walletId: task.wallet._id,
      skey: task.skey1,
    };
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Wallet creation failed');
    nftowner.address = task.contractAddress;
    await Actions.addWallet(nconf, nftowner);
    check('NFT Owner deployed');

    // Add wallet : Minter
    task = await service.addWallet('ref1', 'onchain');
    if (task === false) error('Failed to deploy a Wallet');
    const minter = {
      name: 'minter',
      walletId: task.wallet._id,
      skey: task.skey1,
    };
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Wallet creation failed');
    minter.address = task.contractAddress;
    await Actions.addWallet(nconf, minter);
    check('Minter deployed');

    const contract = {
      name: 'Mutable NFT',
      symbol: 'M1',
      contractType: 51,
      walletId: minter.walletId,
      contractId: 0,
    };
    task = await service.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      contract.walletId,
      contract.contractId
    );
    if (task === false) error('Failed to deploy a Contract');
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Contract creation failed');
    contract.address = task.contractAddress;
    contract.contractId = task.contractId;
    await Actions.addContract(nconf, contract, minter);
    check('NFT Contract deployed');

    warning('\nTest - Mint and Transfer\n');
    await service.addTestMedia();
    const media = await service.getMedia();
    if (media[0].name !== 'dragon.png') error('Media not set');
    check('Test media added');

    // Mint the NFT
    const nft = {
      media: media[0]._id,
      name: 'dragon',
      description: 'The Dragon NFT',
      attributes: [
        { trait_type: 'Color', value: 'Green' },
        { display_type: 'number', trait_type: 'Years', value: '888' },
      ],
    };
    task = await service.mintNFT(
      contract.contractId,
      minter.walletId,
      minter.skey,
      minter.walletId,
      0,
      nft
    );
    if (task === false) error('Failed to mint ');
    await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Minting failed');
    const nftId = task.nft._id;
    check('NFT minted');

    task = await service.transferNFT(
      nftId,
      minter.walletId,
      minter.skey,
      nftowner.walletId
    );
    if (task == false) error('Transfer Failed');
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Transfer failed');
    check('NFT Transferred');

    // error('Get minted NFTs');
    // error('Get metadata');
    // error('Update metadata');
    // error('Get updated metadata');
    log('\nTest finished\n');
  }
}

module.exports = { Test };
