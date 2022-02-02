const path = require('path')
const nconf = require('nconf')
require('dotenv').config()
const { log, title, error } = require('./term')
const { Actions } = require('./actions')
const HOMEMK = (process.env.HOME || process.env.USERPROFILE) + '/.mintknight'

/**
 * Init function
 * @param string action Default action
 */
const init = (action) => {
  const pjson = require('../package.json')
  title('MintKnight client v' + pjson.version)
  nconf.file(path.resolve(HOMEMK, 'config.json'))
  const env = nconf.get('env') || false
  if (env === false && !['register', 'setup', 'help'].includes(action)) {
    Actions.help()
    log('First you need to Register a new user : mk register\n')
    error('No configuration detected')
  }
  return nconf
}

module.exports = { init }
