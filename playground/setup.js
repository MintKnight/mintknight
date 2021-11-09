require('dotenv').config();
const fs = require('fs')
const path = require('path')
const faker = require('faker');

const { MintKnightWeb } = require('../src/index')

const main = async () => {
  const mintknight = new MintKnightWeb(process.env.MINTKNIGHT_API_WEB, {debug: true});
  const conf = {
    email: process.env.USER_EMAIL,
    password: process.env.USER_PASSWORD,
    phone: process.env.USER_PHONE,
  }

  // Add a new admin user.
  const user = await mintknight.addUser(conf.email, conf.password, conf.phone);

  // Login as admin to knitghnight to get the user API KEY.
  console.log(conf);
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

  // Save INFO.
  fs.writeFileSync( path.join(__dirname, 'json', 'project.json'), JSON.stringify(conf), 'utf8');

};

main();
