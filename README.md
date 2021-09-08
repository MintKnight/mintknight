# mintknight-demo
Scripts to interact with the Mintknight API

## Install
```bash
npm install
```

Example:
```javascript
const MintKnight = require('mintknight');
const mintknight = new MintKnight(process.env.MINTKNIGHT_API);

const user = await mintknight.addUser(
    process.env.MK_USERNAME,
    process.env.MK_EMAIL,
    process.env.MK_PASSWORD,
    process.env.MK_PHONE,
  );

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

## Users
First add a new user, login and set the company details
```bash
node 1.useradd.js
node 2.userlogin.js 
```

open .env and set TOKEN

```bash
node 3.addcompany.js
```

## Project and Campaigns
Now add a new project and get an API KEY
```bash
node 4.addproject.js
```
open .env and set PROJECTID

```bash
node 5.getapikey.js 
```

open .env and set APIKEY

```bash
node 6.addcampaign.js 
```

open .env and set CAMPAIGNID

## Setup Wallets
For this demo we need three wallets, the minter of the collection, the wallet we will mint the NFTs to and the wallet to transfer the NFT to.

```bash
node 7.addwallet.js
```
Save the ID and one of the skey returned (any) to ID and KEY for the three wallets to be created: MINTER, WALLET1 and WALLET2

Every wallet is a Smart Contract deployed to the Blockchain. The call will return a taskId, and you can get the state of the task by calling:

```bash
node task.js <TASKID>
```

## Create a Collection (the NFT Smart Contract) and mint

```bash
node 8.addcollection.js
node task.js <TASKID>
```

It also returns a task. You need to wait for the NFT (ERC721) smart contract to be deployed. The minter wallet is set as minter of the NFTs. You can now access the metadata with the tokenId (first one is zero).

```bash
node 9.mint.js
node task.js <TASKID>
node nft.js 0
```

## Transfer

Now you van transfer the NFT to wallet2
```bash
node 10.transfer.js
node task.js <TASKID>
```
