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

    warning('\nTest - Deploy NFT Contract : ERC721 Mutable\n');
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
    check('NFT Contract ERC721 Immutable deployed');

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

    task = await service.saveNFT(contract.contractId, nft);
    const nftId = task.nft._id;
    if (task.state === 'failed') error('Failed to upload NFT');
    task = await service.mintNFT(
      nftId,
      minter.walletId,
      minter.skey,
      minter.walletId
    );
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Mint failed');
    check('NFT Minted');

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

    warning('\nTest - Deploy NFT Contract : ERC721 Imnmutable\n');
    log('TODO');

    warning('\nTest - Deploy NFT Contract : ERC721 Buyable\n');

    // Deploy Smart Contract - ERC721MinterPauserBuyable.
    const contractERC721Buyable = {
      name: 'Buyable NFT',
      symbol: 'R1',
      contractType: 53,
      walletId: minter.walletId,
      contractId: 0,
    };
    task = await service.addContract(
      contractERC721Buyable.name,
      contractERC721Buyable.symbol,
      contractERC721Buyable.contractType,
      contractERC721Buyable.walletId,
      contractERC721Buyable.contractId
    );
    if (task === false) error('Failed to deploy a Contract - ERC721Buyable');
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Contract creation failed');
    contractERC721Buyable.address = task.contractAddress;
    contractERC721Buyable.contractId = task.contractId;
    await Actions.addContract(nconf, contractERC721Buyable, minter);
    check('NFT Contract ERC 721 Buyable deployed');

    // Deploy Smart COntract - BUYERC721
    const contractBUYERC721 = {
      name: 'Buyer NFT',
      symbol: 'RB1',
      contractType: 100,
      walletId: minter.walletId,
      contractId: contractERC721Buyable.contractId,
    };
    task = await service.addContract(
      contractBUYERC721.name,
      contractBUYERC721.symbol,
      contractBUYERC721.contractType,
      contractBUYERC721.walletId,
      contractBUYERC721.contractId
    );
    if (task === false) error('Failed to deploy a Contract - BUYERC721');
    task = await service.waitTask(task.taskId);
    if (task.state === 'failed') error('Contract creation failed');
    contractBUYERC721.address = task.contractAddress;
    contractBUYERC721.contractId = task.contractId;
    await Actions.addContract(nconf, contractBUYERC721, minter);
    check('NFT Contract ERC BUY721 deployed');

    // Update the minter of contractERC721Buyable to address of contractBUYERC721
    task = await service.updateContract(
      contract.contractId,
      minter,
      0,
      contractBUYERC721.address,
      minter.walletId,
      minter.skey
    );
    if (task === false) error('Failed to set new Minter');
    if (task.state === 'failed') error('setMinter failed');
    log('\nTest finished\n');
  }
}

module.exports = { Test };
