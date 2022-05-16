const fs = require('fs')
const path = require('path')
const prompt = require('prompt');
const chalk = require('chalk');
const { MintKnight, MintKnightWeb } = require('../src/index')
require('dotenv').config();

const log = console.log;
const error = chalk.bold.red;
const warning = chalk.hex('#FFA500'); // Orange color

let mintknight;

const addProject = async(space, project) => {
  // Add a new project.
  const projectdb = await mintknight.addProject(
    project.name,
    project.description,
    project.network
  );
  const conf = { projectId: projectdb._id };

  // Get the API KEY from that project.
  const apiKey = await mintknight.getApiKey(conf.projectId);
  conf.apiKey = apiKey.token;

  await fs.promises.mkdir(path.join(__dirname, '../data', space));
  await fs.promises.mkdir(path.join(__dirname, '../data', space, 'wallets'));
  await fs.promises.mkdir(path.join(__dirname, '../data', space, 'contracts'));
  fs.writeFileSync( path.join(__dirname, '../data', space, 'config.json'), JSON.stringify(conf), 'utf8');
}

const setup = async (space, user, company, project) => {
  const conf = {...user, ...company}

  // Add a new admin user.
  await mintknight.addUser(user.email, user.password, user.phone);

  // Login as admin to knitghnight to get the user API KEY.
  let result = await mintknight.loginUser(user.email, user.password);
  conf.token = result.token;

  // Add a new company for that user.
  const companydb = await mintknight.setCompany(company.name,company.taxid,company.address,company.country);
  conf.companyId = companydb._id;

  // Save INFO.
  fs.writeFileSync( path.join(__dirname, '../data', 'config.json'), JSON.stringify(conf), 'utf8');

  await addProject(space, project);
};

const addWallet = async (space, wallet)  => {
  // Prepare name
  const name = wallet.name.toLowerCase().replace(/ /g, "");

  // Add Wallet.
  let task = await mintknight.addWallet(wallet.ref);
  const walletdb = { walletId: task.wallet._id, skey: task.skey1 };
  task = await mintknight.waitTask(task.taskId);
  walletdb.address = task.addressTo;

  // Write conf.
  fs.writeFileSync( path.join(__dirname, '../data', space, 'wallets',  name + '.json'), JSON.stringify(walletdb), 'utf8');
  log(chalk.green('Success! ') + `wallet saved at /data/wallets/${space}/${name}`)
}

const addContract = async (space, contract, wallet) => {
  const name = contract.name.toLowerCase().replace(/ /g, "");
  let task = await mintknight.deployContract(
     contract.type,
     contract.name,
     contract.symbol,
     contract.description,
     wallet.walletId,
  );
  contractdb = contract;
  contractdb.contractId = task.contract._id;
  task = await mintknight.waitTask(task.taskId);
  contractdb.tokenAddress = task.addressTo;
  fs.writeFileSync( path.join(__dirname, '../data', space,  name + '.json'), JSON.stringify(contractdb), 'utf8');
  log(chalk.green('Success! ') + `contract saved at /data/${space}/${name}`)
}

const main = async () => {
  if (!process.argv[2] || !process.argv[3]) {
    log(error('Invalid command'));
    log(warning('Usage is: mk client action'));
    log('client: name of the client (dataspace)');
    log('action: setup, add, mint');
    process.exit(1);
  }
  const space = process.argv[2];
  const action = process.argv[3];

  if (!['setup', 'project', 'mint', 'wallet', 'contract'].includes(action)) {
    log(error('Invalid Action'));
    log('Valid: setup, project, mint, wallet, contract');
    process.exit();
  }

  prompt.message = "";
  prompt.delimiter = "#";
  prompt.start();

  if (action === 'setup') {
    mintknight = new MintKnightWeb(process.env.MINTKNIGHT_API_WEB, {debug: true});
    log(chalk.green('Project'));
    const project = await prompt.get(['name', 'description', 'network']);
    if (!['mintknight', 'mumbai', 'matic', 'rinkeby', 'mainnet'].includes(project.network)) {
      log(error('Invalid Network'));
      log('Valid: mintknight, mumbai, matic, rinkeby, mainnnet');
      process.exit();
    }
    log(chalk.green('Personal Information'));
    const user = await prompt.get(['username', 'email', 'password', 'phone']);
    log(chalk.green('Company'));
    const company = await prompt.get(['name', 'taxid', 'address', 'country']);
    setup(space, user, company, project);
  } else {
    try {
      const webConfig = require(path.join(__dirname, '../data', 'config.json'));
      mintknight = new MintKnight(process.env.MINTKNIGHT_API_SERVICE, {debug: true, ...config});
    } catch (e) {
       log(error('Environment not ready. Run setup first'));
       process.exit();
    }
    if (action === 'project') {
      console.log('Add project');
    } else {
      let wallet, info;
      switch (action) {
        case 'wallet':
          wallet = await prompt.get(['name', 'ref']);
          await addWallet(space, wallet);
          break;
        case 'contract':
          info = await prompt.get(['minter', 'type', 'name', 'description', 'symbol']);
          try {
            wallet = require(path.join(__dirname, '../data', space,  info.minter + '.json'));
          } catch (e) {
            log(error('No wallet with that name'));
            process.exit();
          }
          await addContract(space, info, wallet);
          break;
        case 'mint':
          info = await prompt.get(['contract', 'minter', 'uri']);
          try {
            wallet = require(path.join(__dirname, '../data', space,  info.minter + '.json'));
            contract = require(path.join(__dirname, '../data', space,  info.contract + '.json'));
          } catch (e) {
            log(error('No wallet with that name'));
            process.exit();
          }
          console.log('ready');
          break;
      }
    }
  }
}

main();
