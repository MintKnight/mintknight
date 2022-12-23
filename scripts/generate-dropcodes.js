#!/usr/bin/env node
const fs = require('fs');
const { log, title, error, warning, detail } = require('../src/term');
const { Prompt } = require('../src/term');
const { rowsToCsv, convertCsv2Array } = require('../src/utils');
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
  // Ask for bundles
  const bundles = await Prompt.text('Number of bundles');
  if (isNaN(bundles)) error(`Must be a number`);
  if (!bundles || bundles < 1) error(`Must be greater than 0`);

  // Ask for number of drop codes
  const dropCodesNumber = await Prompt.text(
    'Number of drop codes to be generated for each bundle'
  );
  if (isNaN(dropCodesNumber)) error(`Must be a number`);
  if (!dropCodesNumber || dropCodesNumber < 1) error(`Must be greater than 0`);

  // Ask for max usages for each drop
  const maxUsage = await Prompt.text('Number of max usages for each drop');
  if (isNaN(maxUsage)) error(`Must be a number`);
  if (!maxUsage || maxUsage < 1) error(`Must be greater than 0`);

  // Ask for filename
  const filename = await Prompt.text(
    `Path and filename. e.g.: ${HOMEMK}/dropcodes_{bundle}.csv`
  );
  if (!filename) error(`Filename is needed`);

  // Ask for filename. Contains Drop codes that we don´t want to repeat
  let dropCodesToSkip = [];
  const filenameDropCodesToSkip = await Prompt.text(
    `Skip dropcodes. Path and filename. e.g.: ${HOMEMK}/dropcodes_to_skip.csv`
  );
  if (!!filenameDropCodesToSkip) {
    dropCodesToSkip = await convertCsv2Array(filenameDropCodesToSkip);
  }

  // Build data
  const csvDataTotal = [];
  for (let b = 1; b <= bundles; b++) {
    const csvData = [];
    for (let i = 0; i < dropCodesNumber; i++) {
      let code;
      let found = true;
      while (found) {
        code = makeid(10);
        if (i === 300) code = '7tA0LsqwFV';
        found = csvDataTotal.find((item) => item.code == code);
        if (found) {
          console.log('Duplicated code: ' + code);
        } else {
          if (dropCodesToSkip.length > 0) {
            found = dropCodesToSkip.find((item) => item.code == code);
            if (found) {
              console.log('Duplicated code: ' + code + ' (CURRENT DROP CODES)');
            }
          }
        }
      }
      csvData.push({ code, maxUsage });
      csvDataTotal.push({ code, maxUsage });
    }
    // Create csv
    var csv = rowsToCsv(csvData);
    //console.log(csv);
    const newFilename = filename.replace('{bundle}', b.toString());
    fs.writeFileSync(newFilename, csv);
    detail('Drop codes generated to: ', newFilename);
  }
};

main();
