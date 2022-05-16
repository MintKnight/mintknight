#!/usr/bin/env node
const fs = require('fs');
const { log, title, error, warning, detail } = require('../src/term');
const { Prompt } = require('../src/term');
const { rowsToCsv } = require('../src/utils');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

const main = async () => {
  // Ask for number of drop codes
  const dropCodesNumber = await Prompt.text(
    'Number of drop codes to be generated'
  );
  console.log('dropCodesNumber', dropCodesNumber);
  if (isNaN(dropCodesNumber)) error(`Must be a number`);
  if (!dropCodesNumber || dropCodesNumber < 1) error(`Must be greater than 0`);

  // Ask for filename
  const filename = await Prompt.text(
    `Path and filename. e.g.: ${HOMEMK}/dropcodes.csv`
  );
  if (!filename) error(`Filename is needed`);

  // Build data
  const csvData = [{ code: 1, maxUsage: 1 }];
  var csv = rowsToCsv(csvData);
  //console.log(csv);
  fs.writeFileSync(filename, csv);

  detail('Drop codes generated to: ', filename);
};

main();
