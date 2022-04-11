# mintknight
Javascript Library to interact with the Mintknight API

## Install
```bash
npm install
cp .env.example .env
```

Edit .env file with connection Parameters:
MINTKNIGHT_API_WEB=https://webapi.sandbox.mintknight.com/
MINTKNIGHT_API_SERVICE=https://api.sandbox.mintknight.com/

We have two APIs, one for management (users, companies, projects...) and one strictly for Blockchain. At Sandbox level it is possible to access the Web API, but in production it is restricted.

Example:
```javascript
const MintKnight = require('mintknight');
const mintknight = new MintKnight(process.env.MINTKNIGHT_API_WEB);
```

## Using the CLI
```bash
mk help
mk setup
mk register
```

This will add a new user to the Sandbox, setup a company, a project and a campaign.
You are now ready to play with contracts.

Examples: 
```bash
mk add wallet
mk add contract
mk mint token
```

The Ids for project, campaign, wallets and tokens are stored inside $HOME/.mintknight/
