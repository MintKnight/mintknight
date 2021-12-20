const chalk = require('./term');
const fs = require('fs');
const path = require('path')
const nconf = require('nconf');
require('dotenv').config();
const { log, title, error, warning, proceed } = require('./term');
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight';

/**
 * Init function
 * @param string action Default action
 */
const init = (action) => {
  var pjson = require('../package.json');
  title('MintKnight client v'+pjson.version);
  nconf.env();
  nconf.file( path.resolve( HOMEMK, `config.${nconf.get('ENV')}.json` ));
  const token = nconf.get('user:token') || false;
  if ((token === false) && !['login', 'register'].includes(action)) {
    log('\nFirst you need to login (mk login) or Register (mk register)');
    error('No user detected');
  }
  return nconf;
}

module.exports = { init };

