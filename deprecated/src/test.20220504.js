const fs = require('fs');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';
const { log, title, error, warning, detail, check } = require('./term');
const { MintKnight, MintKnightWeb } = require('../src/index');
const { Actions } = require('./actions');
const ethers = require('ethers');
const BuyContract = require('./contracts/ERC721BuyRandom.json');
const ERC721Contract = require('./contracts/ERC721MinterPauserBuyable.json');

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
  static async go(nconf) {
    // Setup connection to Mintknight - Web.
    const props = {
      debug: false,
      token: false,
    };
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
      network: process.env.MINTKNIGHT_NETWORK,
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

    /*
     * Prepare Wallets : signer, minter & owner
     *
     * 1 - Connect to MintKnight Web with the project Token.
     * 2 - Add Wallet - signer (not onchain), used to sign txs.
     * 3 - Add Wallet - owner (onchain), final owner of the NFTs.
     * 4 - Add Wallet - minter (onchain), Can mint to the NFT contracts.
     */

    // 1 - Connect to MintKnight Web with the project Token.
    const urlService = process.env.MINTKNIGHT_API_SERVICE;
    props.apiKey = project.token;
    let service = new MintKnight(
      urlService,
      props,
      'local',
      project.projectId,
      false
    );

    // 2 - Add Wallet - signer (not onchain), used to sign txs.
    let task = await service.addWallet('ref3', 'signer');
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
    let taskResult = await checkTask(
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
    nftowner.address = taskResult.contractAddress;

    // Save to local env.
    await Actions.addWallet(nconf, nftowner);
    check('NFT Owner deployed');

    // 4 - Add Wallet - minter (onchain), Can mint to the NFT contracts.
    task = await service.addWallet('ref1', 'onchain');
    taskResult = await checkTask(
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
    minter.address = taskResult.contractAddress;

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
    taskResult = await checkTask(
      task,
      service,
      'ERC721MinterPauserMutable deployed',
      'Failed to deploy ERC721MinterPauserMutable'
    );

    contract.address = taskResult.contractAddress;
    contract.contractId = taskResult.contractId;

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
    taskResult = await checkTask(
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
    taskResult = await checkTask(
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
    taskResult = await checkTask(
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

    /*
     * Contract ERC721 Buyable - Test
     * Allows the NFTs to be bought from a different BUY Contract (the minter)
     * The NFT admin needs to sign the tokenId for the user to be able to buy it.
     *
     * 1 - Deploy ERC721MinterPauserBuyable Contract. (type 53)
     * 2 - Deploy BUYERC721 Contract. (type 100)
     * 3 - Set signer as the verifier for BUYERC721
     * 4 - Set BUYERC721 as the minter for ERC721MinterPauserBuyable
     * 5 - Set Prices for BUYERC721.
     * 6 - Create the Signature for an array of tokenIds.
     * 7 - The user (wallet) Buys and Mints the NFTs. It gets a basic URI.
     * 8 - Saves the NFTs as draft (using previous mediaId).
     * 9 - Mints the NFTs (writes to the Blockchain -> setURI).
     */
    warning('\nTest - Deploy NFT Contract : ERC721MinterPauserBuyable\n');

    // 1 - Deploy ERC721MinterPauserBuyable Contract. (type 53)
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
      contractERC721Buyable.contractId,
      media[0]._id
    );
    taskResult = await checkTask(
      task,
      service,
      'ERC721MinterPauserBuyable deployed',
      'Failed to deploy ERC721MinterPauserBuyable'
    );

    contractERC721Buyable.address = taskResult.contractAddress;
    contractERC721Buyable.contractId = taskResult.contractId;

    // Save to local env.
    await Actions.addContract(nconf, contractERC721Buyable, minter);

    // 2 - Deploy BUYERC721 Contract. (type 100)
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
    taskResult = await checkTask(
      task,
      service,
      'BUYERC721 deployed',
      'Failed to deploy BUYERC721'
    );
    contractBUYERC721.address = taskResult.contractAddress;
    contractBUYERC721.contractId = taskResult.contractId;

    // Save to local env.
    await Actions.addContract(nconf, contractBUYERC721, minter);

    // 3 - Set signer as the verifier for BUYERC721
    task = await service.updateVerifier(
      contractBUYERC721.contractId,
      signer.walletId,
      minter.walletId,
      minter.skey
    );
    taskResult = await checkTask(
      task,
      service,
      'Verifier updated',
      'Failed to Update Verifier'
    );

    // 4 - Set BUYERC721 as the minter for ERC721MinterPauserBuyable
    task = await service.updateContract(
      contractERC721Buyable.contractId,
      'minter',
      0,
      contractBUYERC721.address,
      minter.walletId,
      minter.skey
    );
    taskResult = await checkTask(
      task,
      service,
      'updated minter for ERC721MinterPauserBuyable',
      'Failed to update minter for ERC721MinterPauserBuyable'
    );

    // 5 - Set Prices for BUYERC721.
    const prices = '0.009,0.008,0.007,0.006,0';
    task = await service.updatePrices(
      contractBUYERC721.contractId,
      prices,
      minter.walletId,
      minter.skey
    );
    taskResult = await checkTask(
      task,
      service,
      'updated prices for ERC721MinterPauserBuyable',
      'Failed to update prices for ERC721MinterPauserBuyable'
    );

    // 6 - Create the Signature for an array of tokenIds.
    // const tokens = [100, 101, 102];
    // const { signatures } = await service.getSignature(
    //   contractBUYERC721.contractId,
    //   tokens,
    //   wallet.address,
    //   signer.walletId,
    //   signer.skey
    // );

    // // 7 - The user (wallet) Buys and Mints the NFTs. It gets a basic URI.
    // const basePrice = ethers.utils.parseUnits('0.024');
    // const buyNFT = new ethers.Contract(
    //   contractBUYERC721.address,
    //   BuyContract.abi,
    //   wallet
    // );

    // const tx = await buyNFT.mintNft(tokens, signatures, { value: basePrice });
    // await tx.wait();

    // const nft721 = new ethers.Contract(
    //   contractERC721Buyable.address,
    //   ERC721Contract.abi,
    //   wallet
    // );

    // result = await nft721.balanceOf(wallet.address);
    // check(`${result.toNumber()} NFTs bought`);

    // console.log(contractERC721Buyable);
    // const nft1 = await service.getNft(contractERC721Buyable.contractId, 0);
    // console.log(nft1);

    // 8 - Saves the NFTs as draft (using previous mediaId).
    // 9 - Mints the NFTs (writes to the Blockchain -> setURI).

    log('\nTest finished\n');
  }

  static async drops(nconf) {
    const env = nconf.get('env');
    let task, taskResult;

    // Project
    const projectId = nconf.get(`${env}:projectId`);
    const project = nconf.get(`${env}:${projectId}`);

    // Connect to Service.
    const urlService = process.env.MINTKNIGHT_API_SERVICE;
    const props = {
      debug: false,
      token: false,
      apiKey: project.token,
    };
    props.apiKey = project.token;
    let service = new MintKnight(
      urlService,
      props,
      'local',
      project.projectId,
      false
    );

    /*
     * Add Wallet for drops - minter (onchain)
     */
    // warning(
    //   '\nWallet - Creating on-chain wallet (MKWallet for direct minting)\n'
    // );

    // task = await service.addWallet('wonchain', 'onchain');
    // taskResult = await checkTask(
    //   task,
    //   service,
    //   'Wallet minter deployed',
    //   'Failed to deploy minter'
    // );
    // const minter = {
    //   name: 'minter',
    //   walletId: task.wallet._id,
    //   skey: task.skey1,
    // };
    // minter.address = taskResult.contractAddress;

    // // Save to local env.
    // await Actions.addWallet(nconf, minter);

    /*
     * Add Wallet for drops - signer (off-chain), used to sign txs.
     */
    warning('\nWallet - Creating off-chain wallet\n');

    task = await service.addWallet('woffchain', 'signer');
    taskResult = await checkTask(
      task,
      service,
      'Wallet offchain for drops created',
      'Failed to create wallet for drops'
    );
    const signer = {
      name: 'signer',
      walletId: task.wallet._id,
      skey: task.skey1,
      address: task.wallet.address,
    };

    // Save to local env.
    await Actions.addWallet(nconf, signer);

    /*
     * Add Contract for drops
     */
    warning('\nContract - Creating contract for drops\n');
    // ERC721MinterPauserMutable or ERC721MinterPauserInmutable

    // 1 - Deploy ERC721MinterPauserMutable Contract. (type 51)
    const urlCode = `collection-${makeid(10)}`;
    const urlLandingPage = `http://localhost:3002/${urlCode}`;
    const contract = {
      name: 'MutableNFTsForDrops',
      symbol: 'MDROPS',
      contractType: 51,
      walletId: signer.walletId,
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
    taskResult = await checkTask(
      task,
      service,
      'ERC721MinterPauserMutable deployed',
      'Failed to deploy ERC721MinterPauserMutable'
    );
    contract.address = taskResult.contractAddress;
    contract.contractId = taskResult.contractId;

    check(`Contract address: ${contract.address}`);

    // Save to local env.
    await Actions.addContract(nconf, contract, signer);

    /*
     * Upload NFTs (Bulk mode)
     */
    warning('\nNFTs - Upload NFTS on Bulk mode\n');
    const csvFilename = './assets/nft-bulkdata1.csv';
    const zipFilename = './assets/animals.zip';
    task = await service.uploadBulkNFTs(
      contract.contractId,
      csvFilename,
      zipFilename
    );
    taskResult = await checkTask(
      task,
      service,
      'Uploaded NFTS in bulk mode. The state of each NFT is draft',
      'Failed to upload NFTs'
    );

    /*
     * Upload only one NFT
     */
    warning('\nNFTs - Upload only one NFT\n');
    task = await service.uploadNFT(
      contract.contractId,
      {
        tokenId: 50,
        name: 'Only one NFT',
        description: 'Uploaded alone',
        price: 0,
        coin: '',
        attributes: [],
      },
      './assets/nft.png',
      null
      // 'nft.png',
      // fs.readFileSync('./assets/nft.png')
    );
    taskResult = await checkTask(
      task,
      service,
      'Uploaded NFT. The state of this NFT is draft',
      'Failed to upload NFT'
    );

    /*
     * Create drops
     */
    warning('\nDrop - Create drops\n');

    // Direct minting drop
    task = await service.addDrop(contract.contractId, {
      name: 'Name: Drop with NFTs buyables',
      description: 'NOT Direct minting',
      dropType: 'raffle', // fifo or raffle
      useCodes: 0, // 0 or 1
      isDirectMinting: 0, // 0 or 1
      price: 1,
      coin: 'matic',
      startDate: '2022-01-01',
      endDate: '2025-12-31',
    });
    taskResult = await checkTask(
      task,
      service,
      'Drop created successfully',
      'Failed to create Drop'
    );

    // Not Direct minting drop
    task = await service.addDrop(contract.contractId, {
      name: 'Name: Drop with free NFTs',
      description: 'Direct minting',
      dropType: 'fifo', // fifo or raffle
      useCodes: 0, // 0 or 1
      isDirectMinting: 1, // 0 or 1
      price: 0,
      coin: 'matic',
      startDate: '2022-01-01',
      endDate: '2025-12-31',
    });
    taskResult = await checkTask(
      task,
      service,
      'Drop created successfully',
      'Failed to create Drop'
    );

    check(`Landing page url: ${urlLandingPage}`);
  }

  static async buy(nconf) {
    const env = nconf.get('env');

    // Project
    const projectId = nconf.get(`${env}:projectId`);
    const project = nconf.get(`${env}:${projectId}`);

    // Signer.
    const wallets = nconf.get(`${env}:${projectId}:wallets`);
    const signerId = wallets[0];
    const signer = nconf.get(`${env}:${projectId}:${signerId}`);
    const ownerId = wallets[1];
    const owner = nconf.get(`${env}:${projectId}:${ownerId}`);
    const minterId = wallets[2];
    const minter = nconf.get(`${env}:${projectId}:${minterId}`);

    // Buy contract
    const contracts = nconf.get(`${env}:${projectId}:contracts`);
    const contract721Id = contracts[1];
    const contractId = contracts[2];
    const contractERC721Buyable = nconf.get(
      `${env}:${projectId}:${contracts[1]}`
    );
    const contractBUYERC721 = nconf.get(`${env}:${projectId}:${contracts[2]}`);
    const contract = nconf.get(`${env}:${projectId}:${contractId}`);

    detail('Signer', signer.name);
    detail('Owner', owner.name);
    detail('Minter', minter.name);
    detail('Contract', contract.name);

    // Connect to Service.
    const urlService = process.env.MINTKNIGHT_API_SERVICE;
    const props = {
      debug: false,
      token: false,
      apiKey: project.token,
    };
    props.apiKey = project.token;
    let service = new MintKnight(
      urlService,
      props,
      'local',
      project.projectId,
      false
    );

    let wallet = new ethers.Wallet(
      '0x3e139eae34f41cecf4b4adccbeaa3a51c0b05c695733d8416df121b5b6d5e79b'
    );
    const provider = new ethers.providers.JsonRpcProvider(
      'http://localhost:8545'
    );
    const balance = await provider.getBalance(wallet.address);
    wallet = wallet.connect(provider);

    // Buy NFTs
    const tokenId = Math.floor(Math.random() * 1000000000);
    // const tokens = [tokenId, tokenId + 1, tokenId + 2];
    const tokens = [tokenId];
    const signatures = await service.getSignature(
      contractId,
      tokens,
      wallet.address,
      signerId,
      signer.skey
    );

    const basePrice = ethers.utils.parseEther('5');
    const buyNFT = new ethers.Contract(
      contractBUYERC721.address,
      BuyContract.abi,
      wallet
    );
    const tx = await buyNFT.mintNft(tokens, signatures, { value: basePrice });
    await tx.wait();
    check('NFTs bought');

    const nft721 = new ethers.Contract(
      contractERC721Buyable.address,
      ERC721Contract.abi,
      wallet
    );

    let result = await nft721.balanceOf(wallet.address);

    const media = await service.getMedia();
    for (let i = 0; i < tokens.length; i++) {
      const nft = {
        media: media[0]._id,
        name: `test NFT #${tokens[i]}`,
        description: 'The Dragon NFT',
        attributes: [{ trait_type: 'Color', value: 'Green' }],
      };
      let task = await service.saveNFT(contract721Id, nft, tokens[i]);
      let taskResult = await checkTask(
        task,
        service,
        'NFT Saved -> metadata uploaded to Arweave',
        'Metadata upload failed'
      );
      const nftId = task.nft._id;
      task = await service.mintNFT(nftId, minterId, minter.skey);
    }

    // servoice.mintNft();

    // GetTokenURI-- > Check;
  }
}

module.exports = { Test };
