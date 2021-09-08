require('dotenv').config();
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
  console.log(conf);
};

main();
