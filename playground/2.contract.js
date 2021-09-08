require('dotenv').config();
const fs = require('fs')
const path = require('path')
const project = require('./project.json');
const MintKnight = require('../src/index')
// const MintKnight = require('mintknight')

const main = async () => {
  const mintknight = new MintKnight(process.env.MINTKNIGHT_API, {debug: true, ...project});
process.exit();
  const apiKey = await mintknight.getApiKey(conf.projectId);
  fs.writeFileSync( path.join(__dirname, '/project.json'), JSON.stringify(conf), 'utf8');
};

main();
