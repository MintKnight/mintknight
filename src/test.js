const { log, error, errorNoExit, warning, check, detail } = require('./term');
const { MintKnight } = require('../src/index');
const { Config } = require('./actions');
const ethers = require('ethers');
const nconf = require('nconf');

const props = {
  debug: false,
  token: false,
};
let mintknight;

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
async function checkTask(task, okMessage, errMessage) {
  let taskResult = false;
  if (task === false || task.success === false) error(errMessage);
  let taskId = null;
  if (!!task.taskId) taskId = task.taskId;
  else if (!!task.data && !!task.data.taskId) taskId = task.data.taskId;
  if (!!taskId) {
    taskResult = await mintknight.waitTask(taskId);
    if (taskResult.state === 'failed') error(errMessage);
  }
  check(okMessage);
  return taskResult;
}

// Check Tasks (multi-tasking)
async function checkTasks(tasks, times = 1000) {
  let taskResult;
  const allTaskFinished = () => {
    let ret = true;
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      // console.log('allTaskFinished task.finished', task.finished);
      if (!task.finished) {
        return false;
      }
    }
    // console.log('allTaskFinished ret', ret);
    return ret;
  };
  while (!allTaskFinished()) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      // console.log('task', i, task);
      if (task.finished) continue;
      taskResult = await mintknight.waitTask(task.data.taskId, times);
      // console.log('task taskResult', i, taskResult);
      if (!taskResult.finished) continue;
      tasks[i].finished = true;
      if (taskResult.state === 'success') {
        check(task.okMessage);
      } else if (taskResult.state === 'failed') {
        errorNoExit(task.errMessage);
      } else {
        warning('Unknown status');
      }
    }
  }
}
class Test {
  static async init() {
    let result,
      config = {};
    // Setup connection to Mintknight.
    const urlApi = process.env.MINTKNIGHT_API_SERVICE;
    mintknight = new MintKnight(urlApi, props);

    // Prepare local env.
    const env = 'local';
    nconf.set('env', env);
    nconf.save();

    /*
     * User Registration
     *
     * 1 - User Registration -> get user Token
     * 2 - Set the user token in order to connect with MintKnight
     * 3 - Register company
     * 4 - Add first project
     * 5 - Get API KEY for the project
     */
    warning('\nTest - User Registration & Setup\n');

    // 1 - User Registration -> get user Token
    result = await mintknight.registerUser(
      `${makeid(10)}$mk.com`,
      'testpassword'
    );
    if (!result.success)
      error(`Error while registering the user: ${result.error}`);
    check('User registered');
    config = result.data;

    // 2 - Connect to MintKnight Api with the user Token.
    mintknight.setToken(result.data.token);

    // 3 - Register company.
    result = await mintknight.setCompany('NFT Org');
    if (!result.success) error('Error adding company');
    check('User registered');
    config.companyId = result.data._id;

    // Save user to local env.
    await Config.saveUser(nconf, config);
    check('Company added');

    // 4 - Add first project.
    const project = {
      name: 'NFT Project',
      //network: 'localhost',
      network: process.env.MINTKNIGHT_TEST_NETWORK,
    };
    result = await mintknight.addProject(project.name, project.network);
    if (!result.success) error('Error adding project');
    project.projectId = result.data._id;
    check('Project added');

    // 5 - Get API KEY of the project
    result = await mintknight.getApiKey(project.projectId);
    project.token = result.data.token;

    // Save project to local env.
    await Config.addProject(nconf, project);
    check('Got API KEY');

    // Set the project Token.
    mintknight.setApiKey(project.token);
  }

  static async go(nconf) {
    await this.init();
    let task,
      taskResult1,
      addWalletRet,
      deployWalletRet,
      addContractRet,
      deployContractRet,
      addNFTRet,
      mintNFTRet,
      transferNFTRet;

    /*
     * Prepare Wallets : signer, minter & owner
     *
     * 1 - Add Wallet - signer (not onchain), used to sign txs.
     * 2 - Add Wallet - owner (onchain), final owner of the NFTs.
     * 3 - Add Wallet - minter (onchain), Can mint to the NFT contracts.
     */

    // 1 - Add Wallet - signer (not onchain), used to sign txs.
    addWalletRet = await mintknight.addWallet('ref3', 'signer');
    await checkTask(addWalletRet, 'Signer created', 'Failed to add signer');
    const signer = {
      name: 'signer',
      walletId: addWalletRet.data.wallet._id,
      skey: addWalletRet.data.skey1,
      address: addWalletRet.data.wallet.address,
    };

    // Save to local env.
    await Config.addWallet(nconf, signer);

    // 2 - Add Wallet - owner (onchain), admin of the NFT contracts.
    addWalletRet = await mintknight.addWallet('ref2', 'onchain');
    await checkTask(
      addWalletRet,
      'Wallet owner added',
      'Failed to add owner wallet'
    );
    deployWalletRet = await mintknight.deployWallet(
      addWalletRet.data.wallet._id
    );
    taskResult1 = await checkTask(
      deployWalletRet,
      'Wallet owner deployed',
      'Failed to deploy owner'
    );
    const nftowner = {
      name: 'nftowner',
      walletId: addWalletRet.data.wallet._id,
      skey: addWalletRet.data.skey1,
    };
    nftowner.address = taskResult1.contractAddress;

    // Save to local env.
    await Config.addWallet(nconf, nftowner);
    check('NFT Owner deployed');

    // 3 - Add Wallet - minter (onchain), Can mint to the NFT contracts.
    addWalletRet = await mintknight.addWallet('ref1', 'onchain');
    await checkTask(
      addWalletRet,
      'Wallet minter added',
      'Failed to add minter wallet'
    );
    deployWalletRet = await mintknight.deployWallet(
      addWalletRet.data.wallet._id
    );
    taskResult1 = await checkTask(
      deployWalletRet,
      'Wallet minter deployed',
      'Failed to deploy minter'
    );
    const minter = {
      name: 'minter',
      walletId: addWalletRet.data.wallet._id,
      skey: addWalletRet.data.skey1,
    };
    minter.address = taskResult1.contractAddress;

    // Save to local env.
    await Config.addWallet(nconf, minter);

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
    };
    addContractRet = await mintknight.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      contract.walletId
    );
    await checkTask(
      addContractRet,
      'ERC721MinterPauserMutable added',
      'Failed to add ERC721MinterPauserMutable'
    );
    contract.contractId = addContractRet.data._id;
    deployContractRet = await mintknight.deployContract(contract.contractId);
    taskResult1 = await checkTask(
      deployContractRet,
      'ERC721MinterPauserMutable deployed',
      'Failed to deploy ERC721MinterPauserMutable'
    );
    contract.address = taskResult1.contractAddress;
    contract.contractId = taskResult1.contractId;

    // Save to local env.
    await Config.addContract(nconf, contract, minter);

    // 2 - Add media (the picture all NFTs will share). It is uploaded to arweave.
    await mintknight.addTestMedia();
    const media = await mintknight.getMedia();
    if (media.data[0].name !== 'dragon.png') error('Media not set');
    check('Test media added');

    // 3 - Saves the NFT as draft (using previous mediaId).
    const nft = {
      mediaId: media.data[0]._id,
      name: 'dragon',
      description: 'The Dragon NFT',
      attributes: JSON.stringify([
        { trait_type: 'Color', value: 'Green' },
        { display_type: 'number', trait_type: 'Years', value: '888' },
      ]),
    };
    addNFTRet = await mintknight.addNFT(contract.contractId, nft);
    await checkTask(addNFTRet, 'NFT added', 'Failed to add NFT');
    const nftId = addNFTRet.data._id;

    // 4 - Mints the NFT (writes to the Blockchain). Uses the minter wallet and mints also to minter.
    mintNFTRet = await mintknight.mintNFT(
      nftId,
      minter.walletId,
      minter.skey,
      minter.walletId
    );
    await checkTask(mintNFTRet, 'NFT minted', 'Failed to mint NFT');

    // 5 - Transfers the NFT to the owner.
    transferNFTRet = await mintknight.transferNFT(
      nftId,
      minter.walletId,
      minter.skey,
      nftowner.walletId
    );
    await checkTask(
      transferNFTRet,
      'NFT transferred',
      'Failed to transfer NFT'
    );

    warning('\nTest - Multi tasking\n');
    const tasks = [];
    for (let i = 1; i <= 10; i++) {
      task = await mintknight.addNFT(contract.contractId, nft);
      await checkTask(task, `NFT ${i} saved`, `Failed to save NFT ${i}`);
      const nftId = task.data._id;
      task = await mintknight.mintNFT(
        nftId,
        minter.walletId,
        minter.skey,
        minter.walletId
      );
      task.okMessage = `NFT ${i} minted`;
      task.errMessage = `Failed to mint NFT ${i}`;
      tasks.push(task);
    }
    await checkTasks(tasks);

    // Test drops
    await this.drops(nconf, true);

    // Test multiples wallets
    await this.wallets(nconf, true);

    log('\nTest finished\n');
  }

  static async drops(nconf, skipInit = false) {
    if (!skipInit) await this.init();
    let task,
      taskResult1,
      data,
      addWalletRet,
      deployWalletRet,
      addContractRet,
      deployContractRet;

    /*
     * Add Wallet for drops (onchain)
     */
    warning('\nDrops - Creating on-chain wallet\n');

    addWalletRet = await mintknight.addWallet('mk', 'onchain');
    deployWalletRet = await mintknight.deployWallet(
      addWalletRet.data.wallet._id
    );
    taskResult1 = await checkTask(
      deployWalletRet,
      'Wallet for drops deployed',
      'Failed to deploy wallet'
    );
    const owner = {
      name: 'owner',
      walletId: addWalletRet.data.wallet._id,
      skey: addWalletRet.data.skey1,
    };
    owner.address = taskResult1.contractAddress;

    // Save to local env.
    await Config.addWallet(nconf, owner);

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
      urlCode: urlCode,
    };
    addContractRet = await mintknight.addContract(
      contract.name,
      contract.symbol,
      contract.contractType,
      contract.walletId,
      contract.urlCode
    );
    contract.contractId = addContractRet.data._id;
    deployContractRet = await mintknight.deployContract(contract.contractId);
    taskResult1 = await checkTask(
      deployContractRet,
      'Contract deployed',
      'Failed to deploy contract'
    );
    contract.address = taskResult1.contractAddress;
    contract.contractId = taskResult1.contractId;
    check(`Contract address: ${contract.address}`);
    // Save to local env.
    await Config.addContract(nconf, contract, owner);

    /*
     * Create drops
     */
    warning('\nDrops - Create drops\n');

    // Direct minting drop
    const directMintingDrop = {
      name: 'Name: Drop with free NFTs',
      description: 'Direct minting',
      dropType: 'fifo', // fifo or raffle
      useCodes: 1, // 0 or 1
      isDirectMinting: 1, // 0 or 1
      price: 0,
      coin: 'matic',
      startDate: '2022-01-01',
      endDate: '2025-12-31',
    };
    task = await mintknight.addDrop(contract.contractId, directMintingDrop);
    await checkTask(
      task,
      `Drop created successfully: ${directMintingDrop.name}`,
      'Failed to create Drop'
    );
    directMintingDrop._id = task.data._id;

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
    task = await mintknight.addDrop(contract.contractId, notDirectMintingDrop);
    await checkTask(
      task,
      `Drop created successfully: ${notDirectMintingDrop.name}`,
      'Failed to create Drop'
    );
    notDirectMintingDrop._id = task.data._id;

    /*
     * Upload only one NFT
     */
    warning('\nDrops - Upload only one NFT\n');
    task = await mintknight.addNFT(
      contract.contractId,
      {
        tokenId: 50,
        name: 'Only one NFT',
        description: 'Uploaded alone',
        attributes: JSON.stringify([
          {
            trait_type: '1',
            display_type: '2',
            value: '3',
          },
        ]),
        dropId: directMintingDrop._id,
      },
      './assets/nft.png',
      null
      // 'nft.png',
      // fs.readFileSync('./assets/nft.png')
    );
    await checkTask(
      task,
      'Uploaded NFT. The state of this NFT is draft',
      'Failed to upload NFT'
    );

    /*
     * Upload NFTs (Bulk mode) -> Drop 1
     */
    warning('\nDrops - Add NFTs for Drop 1\n');
    let csvFilename = './assets/nfts-v2.csv';
    let zipFilename = './assets/animals.zip';
    task = await mintknight.addNFTs(
      contract.contractId,
      csvFilename,
      zipFilename,
      directMintingDrop._id
    );
    await checkTask(
      task,
      'Uploaded NFTS in bulk mode. The state of each NFT is draft',
      'Failed to upload NFTs'
    );

    /*
     * Upload NFTs (Bulk mode) -> Drop 2
     */
    warning('\nDrops - Add NFTs for Drop 2\n');
    csvFilename = './assets/nfts-v2-2.csv';
    zipFilename = './assets/animals.zip';
    task = await mintknight.addNFTs(
      contract.contractId,
      csvFilename,
      zipFilename,
      notDirectMintingDrop._id
    );
    await checkTask(
      task,
      'Uploaded NFTS in bulk mode. The state of each NFT is draft',
      'Failed to upload NFTs'
    );

    /*
     * Upload drop codes for Direct minting drop
     */
    warning('\nDrops - Upload drop codes\n');
    task = await mintknight.addDropCodes(
      directMintingDrop._id,
      './assets/dropcodes.csv'
    );
    await checkTask(task, 'Uploaded drop codes', 'Failed to upload drop codes');
    check(`Landing page url: ${urlLandingPage}`);

    /*
     * Direct minting
     */
    warning('\nDrops - Direct minting\n');
    const buyerAccount = '0x668417616f1502D13EA1f9528F83072A133e8E01';
    // const dropCod = '';
    const dropCod = 'ABCD1';
    data = {
      dropCod,
      userData: {
        email: 'test@test.com',
        name: 'Drop Test User',
      },
      buyer: buyerAccount,
    };
    // First request
    let response = await mintknight.getNftFromDrop(directMintingDrop._id, data);
    if (!response.success)
      error(`Something wrong has succed: ${response.error}`);
    else {
      const directMintingRet1 = response.data;
      taskResult1 = await checkTask(
        { taskId: directMintingRet1.mediaTaskId },
        'Media uploaded successfully',
        'Failed to create Media'
      );
      const nft = directMintingRet1.nft;
      // Add key
      data.skey1 = owner.skey;
      // Second request
      response = await mintknight.mintNftFromDrop(
        directMintingDrop._id,
        nft._id,
        data
      );
      if (!response.success)
        error(`Something wrong has succed minting the NFT: ${response.error}`);
      else {
        const directMintingRet2 = response.data;
        taskResult1 = await checkTask(
          { taskId: directMintingRet2.nftTaskId },
          'NFT minted successfully',
          'Failed to mint NFT'
        );
        // console.log('nft', directMintingRet2.nft);
      }
    }
  }

  static async wallets(nconf, skipInit = false) {
    if (!skipInit) await this.init();
    let addWalletRet, taskResult1;

    /*
     * Add and deploy several wallets (onchain) at the same time
     */
    warning(
      '\nDeploy N MKWallets - Add and deploy several wallets (onchain) at the same time\n'
    );
    const numberOfWallets = 5;
    addWalletRet = await mintknight.addAndDeployWallets(
      numberOfWallets,
      'mk',
      'onchain'
    );
    taskResult1 = await checkTask(
      addWalletRet.data,
      `${numberOfWallets} wallets have been added`,
      'Failed to add wallets'
    );
    const wallets = taskResult1.wallets;
    const contractAddresses = taskResult1.contractAddresses;
    for (let i = 0; i < wallets.length; i++) {
      detail(wallets[i], contractAddresses[i]);
    }
  }
}

module.exports = { Test };
