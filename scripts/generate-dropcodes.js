#!/usr/bin/env node
const fs = require('fs');
const { log, title, error, warning, detail } = require('../src/term');
const { Prompt } = require('../src/term');
const { rowsToCsv } = require('../src/utils');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

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

const main = async () => {
  // Ask for number of drop codes
  const dropCodesNumber = await Prompt.text(
    'Number of drop codes to be generated'
  );
  if (isNaN(dropCodesNumber)) error(`Must be a number`);
  if (!dropCodesNumber || dropCodesNumber < 1) error(`Must be greater than 0`);

  // Ask for max usages for each drop
  const maxUsage = await Prompt.text('Number of max usages for each drop');
  if (isNaN(maxUsage)) error(`Must be a number`);
  if (!maxUsage || maxUsage < 1) error(`Must be greater than 0`);

  // Ask for filename
  const filename = await Prompt.text(
    `Path and filename. e.g.: ${HOMEMK}/dropcodes.csv`
  );
  if (!filename) error(`Filename is needed`);

  // Build data
  const csvData = [];
  for (let i = 0; i < dropCodesNumber; i++) {
    let code;
    let found = true;
    while (found) {
      code = makeid(10);
      found = csvData.find((item) => item.code == code);
    }
    csvData.push({ code, maxUsage });
  }

  // Create csv
  var csv = rowsToCsv(csvData);
  //console.log(csv);
  fs.writeFileSync(filename, csv);

  detail('Drop codes generated to: ', filename);
};

main();
