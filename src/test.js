const { log, title, error, warning, detail, check } = require('./term');
const { MintKnight, MintKnightWeb } = require('../src/index');
const { Actions } = require('./actions');
const ethers = require('ethers');
const nconf = require('nconf');

const props = {
  debug: false,
  token: false,
};
let service;

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

// Check Task and wait for result.
async function checkTask(task, service, okMessage, errMessage) {
  let taskResult = false;
  if (task === false) error(errMessage);
  if (task.taskId !== 0) {
    taskResult = await service.waitTask(task.taskId);
    if (taskResult.state === 'failed') error(errMessage);
  }
  check(okMessage);
  return taskResult;
}
class Test {
  static async init() {
    // Setup connection to Mintknight - Web.
    const urlWeb = process.env.MINTKNIGHT_API_WEB;
    let mintknight = new MintKnightWeb(urlWeb, props);

    // Prepare local env.
    const env = 'local';
    nconf.set('env', env);
    nconf.save();

    /*
     * User Registration
     *
     * 1 - User Regsitration -> get user Token
     * 2 - Connect to MintKnight Web with the user Token.
     * 3 - Register company
     * 4 - Add first project
     * 5 - Get API KEY for the project
     */
    warning('\nTest - User Registration & Setup\n');

    // 1 - User Regsitration -> get user Token
    const config = await mintknight.registerUser(
      `${makeid(10)}$mk.com`,
      'testpassword'
    );
    if (config === false) error('Error while registering the user');
    if (config.status === 'failed') error(config.error);
    check('User registered');

    // 2 - Connect to MintKnight Web with the user Token.
    props.token = config.token;
    mintknight = new MintKnightWeb(urlWeb, props);

    // 3 - Register company.
    let result = await mintknight.setCompany('NFT Org');
    config.companyId = result._id;

    // Save user to local env.
    await Actions.saveUser(nconf, config);
    check('Company added');

    // 4 - Add first project.
    const project = {
      name: 'NFT Project',
      //network: 'localhost',
      network: process.env.MINTKNIGHT_TEST_NETWORK,
    };
    result = await mintknight.addProject(project.name, project.network);
    project.projectId = result._id;
    check('Project added');

    // 5 - Get API KEY of the project
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.token;

    // Save project to local env.
    await Actions.addProject(nconf, project);
    check('Got API KEY');

    // Connect to MintKnight Web with the project Token.
    const urlService = process.env.MINTKNIGHT_API_SERVICE;
    props.apiKey = project.token;
    service = new MintKnight(
      urlService,
      props,
      'local',
      project.projectId,
      false
    );
  }

  static async go(nconf) {
    await this.init();
    let task, taskResult1;

    /*
     * Prepare Wallets : signer, minter & owner
     *
     * 2 - Add Wallet - signer (not onchain), used to sign txs.
     * 3 - Add Wallet - owner (onchain), final owner of the NFTs.
     * 4 - Add Wallet - minter (onchain), Can mint to the NFT contracts.
     */

    // 2 - Add Wallet - signer (not onchain), used to sign txs.
    task = await service.addWallet('ref3', 'signer');
    await checkTask(task, service, 'Signer created', 'Failed to add signer');
    const signer = {
      name: 'signer',
      walletId: task.wallet._id,
      skey: task.skey1,
      address: task.wallet.address,
    };

    // Save to local env.
    await Actions.addWallet(nconf, signer);

    // 3 - Add Wallet - owner (onchain), admin of the NFT contracts.
    task = await service.addWallet('ref2', 'onchain');
    taskResult1 = await checkTask(
      task,
      service,
      'Wallet owner deployed',
      'Failed to deploy owner'
    );
    const nftowner = {
      name: 'nftowner',
      walletId: task.wallet._id,
      skey: task.skey1,
    };
    nftowner.address = taskResult1.contractAddress;

    // Save to local env.
    await Actions.addWallet(nconf, nftowner);
    check('NFT Owner deployed');

    // 4 - Add Wallet - minter (onchain), Can mint to the NFT contracts.
    task = await service.addWallet('ref1', 'onchain');
    taskResult1 = await checkTask(
      task,
      service,
      'Wallet minter deployed',
      'Failed to deploy minter'
    );
    const minter = {
      name: 'minter',
      walletId: task.wallet._id,
      skey: task.skey1,
    };
    minter.address = taskResult1.contractAddress;

    // Save to local env.
    await Actions.addWallet(nconf, minter);

    // Create a EOA Wallet
    let wallet = new ethers.Wallet(
      '0x3e139eae34f41cecf4b4adccbeaa3a51c0b05c695733d8416df121b5b6d5e79b'
    );
    const provider = new ethers.providers.JsonRpcProvider(
      'http://localhost:8545'
    );
    wallet = wallet.connect(provider);
    check(`EOA Wallet created : ${wallet.address}`);

    /*
     * Contract ERC721 Mutable - Test
     * The metadata in the NFT points to an URL hosted in Mintknight
     * This means metadata is dynamic and can be change by the project
     * It needs two wallets : minter and owner (uses the same on the first time)
     *
     * 1 - Deploy ERC721MinterPauserMutable Contract. (type 51)
     * 2 - Add media (the picture all NFTs will share). It is uploaded to arweave.
     * 3 - Saves the NFT as draft (using previous mediaId).
     * 4 - Mints the NFT (writes to the Blockchain). Uses the minter wallet and mints also to minter.
     * 5 - Transfers the NFT to the owner.
     */
    warning('\nTest - Deploy NFT Contract : ERC721MinterPauserMutable\n');

    // 1 - Deploy ERC721MinterPauserMutable Contract. (type 51)
    const contract = {
      name: 'Mutable NFT',
      symbol: 'M1',
      contractType: 51,
      walletId: minter.walletId, //admin and minter of this contract
      contractId: 0,
    };
    task = await service.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      contract.walletId,
      contract.contractId
    );
    taskResult1 = await checkTask(
      task,
      service,
      'ERC721MinterPauserMutable deployed',
      'Failed to deploy ERC721MinterPauserMutable'
    );

    contract.address = taskResult1.contractAddress;
    contract.contractId = taskResult1.contractId;

    // Save to local env.
    await Actions.addContract(nconf, contract, minter);

    // 2 - Add media (the picture all NFTs will share). It is uploaded to arweave.
    await service.addTestMedia();
    const media = await service.getMedia();
    if (media[0].name !== 'dragon.png') error('Media not set');
    check('Test media added');

    // 3 - Saves the NFT as draft (using previous mediaId).
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
    taskResult1 = await checkTask(
      task,
      service,
      'NFT saved',
      'Failed to save NFT'
    );
    const nftId = task.nft._id;

    // 4 - Mints the NFT (writes to the Blockchain). Uses the minter wallet and mints also to minter.
    task = await service.mintNFT(
      nftId,
      minter.walletId,
      minter.skey,
      minter.walletId
    );
    taskResult1 = await checkTask(
      task,
      service,
      'NFT minted',
      'Failed to mint NFT'
    );

    // 5 - Transfers the NFT to the owner.
    task = await service.transferNFT(
      nftId,
      minter.walletId,
      minter.skey,
      nftowner.walletId
    );
    taskResult1 = await checkTask(
      task,
      service,
      'NFT transferred',
      'Failed to transfer NFT'
    );

    // error('Get minted NFTs');
    // error('Get metadata');
    // error('Update metadata');
    // error('Get updated metadata');

    warning('\nTest - Deploy NFT Contract : ERC721 Imnmutable\n');
    log('TODO');

    // Test drops
    await this.drops(nconf, true);

    log('\nTest finished\n');
  }

  static async drops(nconf, skipInit = false) {
    if (!skipInit) await this.init();
    let task, taskResult1, taskResult2, data;

    /*
     * Add Wallet for drops (onchain)
     */
    warning('\nDrops - Creating on-chain wallet\n');

    task = await service.addWallet('wdrops', 'onchain');
    taskResult1 = await checkTask(
      task,
      service,
      'Wallet for drops deployed',
      'Failed to deploy wallet'
    );
    const owner = {
      name: 'owner',
      walletId: task.wallet._id,
      address: task.wallet.address,
      skey: task.skey1,
    };
    owner.contractAddress = taskResult1.contractAddress;

    // Save to local env.
    await Actions.addWallet(nconf, owner);

    /*
     * Add Contract for drops
     */
    warning('\nDrops - Creating contract for drops\n');

    const urlCode = `collection-${makeid(10)}`;
    const urlLandingPage = `http://localhost:3002/${urlCode}`;
    const contract = {
      name: 'ERC721TestDrops',
      symbol: 'DROPS',
      // contractType: 51, // Mutable
      contractType: 52, // Inmutable
      walletId: owner.walletId,
      contractId: 0,
      mediaId: null,
      urlCode: urlCode,
    };
    task = await service.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      contract.walletId,
      contract.contractId,
      contract.mediaId,
      contract.urlCode
    );
    taskResult1 = await checkTask(
      task,
      service,
      'Contract deployed',
      'Failed to deploy contract'
    );
    contract.address = taskResult1.contractAddress;
    contract.contractId = taskResult1.contractId;
    check(`Contract address: ${contract.address}`);
    // Save to local env.
    await Actions.addContract(nconf, contract, owner);

    /*
     * Upload only one NFT
     */
    warning('\nDrops - Upload only one NFT\n');
    task = await service.addNFT(
      contract.contractId,
      {
        tokenId: 50,
        name: 'Only one NFT',
        description: 'Uploaded alone',
        attributes: [
          {
            trait_type: '1',
            display_type: '2',
            value: '3',
          },
        ],
      },
      './assets/nft.png',
      null
      // 'nft.png',
      // fs.readFileSync('./assets/nft.png')
    );
    // console.log('nft', task);
    if (!!task) check('Uploaded NFT. The state of this NFT is draft');
    else error('Failed to upload NFT');

    /*
     * Upload NFTs (Bulk mode)
     */
    warning('\nDrops - Add NFTs at Bulk mode\n');
    const csvFilename = './assets/nft-bulkdata2.csv';
    const zipFilename = './assets/animals2.zip';
    task = await service.addNFTs(contract.contractId, csvFilename, zipFilename);
    if (!!task.nft)
      check('Uploaded NFTS in bulk mode. The state of each NFT is draft');
    else error('Failed to upload NFTs');
    process.exit(1);

    /*
     * Create drops
     */
    warning('\nDrops - Create drops\n');

    // Direct minting drop
    const directMintingDrop = {
      name: 'Name: Drop with free NFTs',
      description: 'Direct minting',
      dropType: 'fifo', // fifo or raffle
      useCodes: 0, // 0 or 1
      isDirectMinting: 1, // 0 or 1
      price: 0,
      coin: 'matic',
      startDate: '2022-01-01',
      endDate: '2025-12-31',
    };
    task = await service.addDrop(contract.contractId, directMintingDrop);
    if (!!task) check(`Drop created successfully: ${directMintingDrop.name}`);
    else error('Failed to create Drop');
    directMintingDrop._id = task._id;

    // Not Direct minting drop
    const notDirectMintingDrop = {
      name: 'Name: Drop with NFTs buyables',
      description: 'NOT Direct minting',
      dropType: 'raffle', // fifo or raffle
      useCodes: 0, // 0 or 1
      isDirectMinting: 0, // 0 or 1
      price: 1,
      coin: 'matic',
      startDate: '2022-01-01',
      endDate: '2025-12-31',
    };
    task = await service.addDrop(contract.contractId, notDirectMintingDrop);
    if (!!task)
      check(`Drop created successfully: ${notDirectMintingDrop.name}`);
    else error('Failed to create Drop');
    notDirectMintingDrop._id = task._id;

    check(`Landing page url: ${urlLandingPage}`);

    /*
     * Direct minting
     */
    warning('\nDrops - Direct minting\n');
    const buyerAccount = '0xf47B89CB6E174faCb9A3C2cf596dCB8ba1C7EF7a';
    data = {
      dropCod: '',
      buyer: buyerAccount,
    };
    let directMintingRet1 = await service.uploadMediaFromDrop(
      directMintingDrop._id,
      data
    );
    console.log('directMintingRet1', directMintingRet1);
    if (directMintingRet1 === false)
      error(`Something wrong uploading media to Arweave`);
    else {
      taskResult1 = await checkTask(
        { taskId: directMintingRet1.mediaTaskId },
        service,
        'Media uploaded successfully',
        'Failed to create Media'
      );
      taskResult2 = await checkTask(
        { taskId: directMintingRet1.metadataTaskId },
        service,
        'Metadata uploaded successfully',
        'Failed to upload Metadata'
      );
      const nft = directMintingRet1.nft;
      data = {
        dropCod: '',
        userData: {
          email: 'test@test.com',
          name: 'Drop Test User',
        },
        buyer: buyerAccount,
        skey1: owner.skey,
      };
      let directMintingRet2 = await service.mintNftFromDrop(
        directMintingDrop._id,
        nft._id,
        data
      );
      if (directMintingRet2 === false) error(`Something wrong minting NFT`);
      else {
        taskResult1 = await checkTask(
          { taskId: directMintingRet2.nftTaskId },
          service,
          'NFT minted successfully',
          'Failed to mint NFT'
        );
        console.log('nft', directMintingRet1.nft);
      }
    }

    /*
     * Not Direct minting
     */
    warning('\nDrops - NOT Direct minting\n');

  }
}

module.exports = { Test };
