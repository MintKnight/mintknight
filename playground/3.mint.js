require('dotenv').config();
const path = require('path')
const project = require('./project.json');
const minter = require('./minter.json');
const wallet1 = require('./wallet1.json');
const wallet2 = require('./wallet2.json');

const MintKnight = require('../src/index')
// const MintKnight = require('mintknight')

const main = async () => {
  const mintknight = new MintKnight(process.env.MINTKNIGHT_API, {debug: true, ...project});
  let task = await mintknight.uploadImage(path.join(__dirname, 'image.png'));
  task = await mintknight.waitTask(task.taskId);
  console.log(task);
};

main();
