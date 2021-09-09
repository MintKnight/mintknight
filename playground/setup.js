require('dotenv').config();
const fs = require('fs')
const path = require('path')

const MintKnight = require('../src/index')
// const MintKnight = require('mintknight')


const main = async () => {
  const conf = {}
  const mintknight = new MintKnight(process.env.MINTKNIGHT_API, {debug: true});

  // Add a new admin user.
  const user = await mintknight.addUser(
    process.env.USER_USERNAME,
    process.env.USER_EMAIL,
    process.env.USER_PASSWORD,
    process.env.USER_PHONE,
  );

  // Login as admin to knitghnight to get the user API KEY.
  let result = await mintknight.loginUser(
    process.env.USER_EMAIL,
    process.env.USER_PASSWORD,
  );
  conf.token = result.token;

  // Add a new company for that user.
  const company = await mintknight.setCompany(
    process.env.COMPANY_NAME,
    process.env.COMPANY_TAXID,
    process.env.COMPANY_ADDRESS,
    process.env.COMPANY_COUNTRY,
  );
  conf.companyId = company._id;

  const project = await mintknight.addProject(
    process.env.PROJECT_NAME,
    process.env.PROJECT_DESCRIPTION,
    process.env.PROJECT_NETWORK,
  );
  conf.projectId = project._id;

  const apiKey = await mintknight.getApiKey(conf.projectId);
  conf.apiKey = apiKey.token;

  const campaign = await mintknight.addCampaign(
    process.env.CAMPAIGN_NAME,
    process.env.CAMPAIGN_DESCRIPTION,
    conf.projectId,
  );
  conf.campaignId = campaign._id;
  fs.writeFileSync( path.join(__dirname, 'json', 'project.json'), JSON.stringify(conf), 'utf8');

  // Add minter for the contract.
  let task = await mintknight.addWallet('id_user_internal_1');
  const minter = { walletId: task.wallet._id, skey: task.skey1 };
  task = await mintknight.waitTask(task.taskId);
  minter.address = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'minter.json'), JSON.stringify(minter), 'utf8');

  // Add Wallet 1 for the contract.
  task = await mintknight.addWallet('id_user_internal_2');
  const wallet1 = { walletId: task.wallet._id, skey: task.skey1 };
  task = await mintknight.waitTask(task.taskId);
  wallet1.address = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'wallet1.json'), JSON.stringify(wallet1), 'utf8');

  // Add Wallet 2 for the contract.
  task = await mintknight.addWallet('id_user_internal_3');
  const wallet2 = { walletId: task.wallet._id, skey: task.skey1 };
  task = await mintknight.waitTask(task.taskId);
  wallet2.address = task.addressTo;
  fs.writeFileSync( path.join(__dirname, 'json', 'wallet2.json'), JSON.stringify(wallet2), 'utf8');
};

main();
