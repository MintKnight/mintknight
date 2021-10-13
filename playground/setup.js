require('dotenv').config();
const fs = require('fs')
const path = require('path')
const faker = require('faker');

const { MintKnightWeb } = require('../src/index')

const main = async () => {
  const mintknight = new MintKnightWeb(process.env.MINTKNIGHT_API_WEB, {debug: true});
  const conf = {
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    phone: faker.phone.phoneNumber(),
  }

  // Add a new admin user.
  const user = await mintknight.addUser(conf.username, conf.email, conf.password, conf.phone);

  // Login as admin to knitghnight to get the user API KEY.
  let result = await mintknight.loginUser(conf.email, conf.password);
  conf.token = result.token;

  // Add a new company for that user.
  const company = await mintknight.setCompany(
    process.env.COMPANY_NAME,
    process.env.COMPANY_TAXID,
    process.env.COMPANY_ADDRESS,
    process.env.COMPANY_COUNTRY,
  );
  conf.companyId = company._id;

  // Add a new project.
  const project = await mintknight.addProject(
    process.env.PROJECT_NAME,
    process.env.PROJECT_DESCRIPTION,
    process.env.PROJECT_NETWORK,
  );
  conf.projectId = project._id;

  // Get the API KEY from that project.
  const apiKey = await mintknight.getApiKey(conf.projectId);
  conf.apiKey = apiKey.token;

  const campaign = await mintknight.addCampaign(
    process.env.CAMPAIGN_NAME,
    process.env.CAMPAIGN_DESCRIPTION,
    conf.projectId,
  );
  conf.campaignId = campaign._id;

  // Add the contract to the project ERC20.
  let contract = await mintknight.writeTokenContract(
     process.env.TOKEN_NAME,
     process.env.TOKEN_SYMBOL,
     process.env.TOKEN_DESCRIPTION,
     conf.campaignId,
  );
  conf.tokenId = contract._id;

  // Add the contract to the project NFTs.
  contract = await mintknight.writeNFTContract(
     process.env.TOKEN_NAME,
     process.env.TOKEN_SYMBOL,
     process.env.TOKEN_DESCRIPTION,
     conf.campaignId,
  );
  conf.nftId = contract._id;

  // Save INFO.
  fs.writeFileSync( path.join(__dirname, 'json', 'project.json'), JSON.stringify(conf), 'utf8');

};

main();
