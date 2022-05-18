const path = require('path');
const nconf = require('nconf');
require('dotenv').config();
const { log, title, error } = require('./term');
const { Actions } = require('./actions');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

/**
 * Init function
 * @param string action Default action
 */
const init = (action) => {
  const pjson = require('../package.json');
  title('MintKnight client v' + pjson.version);
  nconf.file(path.resolve(HOMEMK, 'config.json'));
  const env = nconf.get('env') || false;
  if (
    env === false &&
    !['register', 'setup', 'help', 'test'].includes(action)
  ) {
    Actions.help();
    log('First you need to Register a new user : mk register\n');
    error('No configuration detected');
  }
  return nconf;
};

const rowsToCsv = (rows) => {
  var csv = '';
  if (rows.length == 0) return csv;

  // Header
  for (const property in rows[0]) {
    csv += property + ';';
  }
  csv += '\n';

  // Content
  rows.forEach(async (row) => {
    for (const property in row) {
      let value = row[property];
      if (value != null && property == 'date') {
        value = this.formatDateTime(value);
      }
      csv += value + ';';
    }
    csv += '\n';
  });

  return csv;
};

module.exports = { init, rowsToCsv };
