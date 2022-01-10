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
  nconf.file( path.resolve( HOMEMK, `config.json` ));
  const env = nconf.get('env') || false;
  if (env === false && action != 'register') {
    log('First you need to Register a new user : mk register\n');
    error('No configuration detected');
  }
  return nconf;
}

module.exports = { init };

