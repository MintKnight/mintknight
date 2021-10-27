# mintknight
Javascript Library to interact with the Mintknight API

## Install
```bash
npm install
```

Create a new .env file with connection Parameters:
MINTKNIGHT_API_WEB=https://webapi.sandbox.mintknight.com/
MINTKNIGHT_API_SERVICE=https://serviceapi.sandbox.mintknight.com/

We have two APIs, one for management (users, companies, projects...) and one strictly for Blockchain. At Sandbox level it is possible to access the Web API, but in production it is restricted.

Example:
```javascript
const MintKnight = require('mintknight');
const mintknight = new MintKnight(process.env.MINTKNIGHT_API_WEB);
```

## Using the Playground
```bash
cd playground
cp .env.example .env
```
Edit the basic fields you need:
- MK_USERNAME
- MK_EMAIL
- MK_PASSWORD
- MK_PHONE
(minimum 5 letters)

```bash
node 1.setup.js
```

This will add a new user to the Sandbox, setup a company, a project and a campaign.
You are now ready to play with contracts.

The Ids for project, campaign, wallets and tokens are stored inside /json

## Setup Wallets
For this demo we need three wallets, the minter of the collection, the wallet we will mint the NFTs to and the wallet to transfer the NFT to.

```bash
node wallet.js
```
Every wallet is a Smart Contract deployed to the Blockchain. The call will return a taskId.

## Tokens

The token_example.js wis an example of howto:
1. Deploy the ERC20 contract
2. Mint the first tokens
3. Transfer tokens between wallets
4. Transfer tokens to external address (not in MintKnight)
5. Transfer tokens from an external ERC20 contract (not in MintKnight).
6. Check The Balance
