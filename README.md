# mintknight
Javascript Library to interact with the Mintknight API

## Install
```bash
npm install
```

Now, You have two ways to use this amazing SDK:
- Javascript API
- Command line interface (CLI)

## Javascript API
```bash
cp .env.example .env
```

Edit .env file with the desired connection parameters:

- MINTKNIGHT_API_SERVICE=https://api.sandbox.mintknight.com/

We have two APIs, one for management (users, companies, projects...) and one strictly for Blockchain. At Sandbox level it is possible to access the Web API, but in production it is restricted.

Example:
```javascript
const MintKnight = require('mintknight');
const mintknight = new MintKnight(process.env.MINTKNIGHT_API);
```

Learn more about Mintknight API:
https://mintknight.gitbook.io/

## Using the CLI
### First steps
With this command, you can see the information of the current setup:
```bash
mk
```
Show all the command options:
```bash
mk help
```

### Setup and register
```bash
mk register
```
This will add a new user, setup a company, a project on a certain network.
You are now ready to play with contracts.

The Ids for project, campaign, wallets and tokens are stored inside $HOME/.mintknight/

### ERC20 tokens
###### Add a new Wallet to project
```bash
mk add wallet
```
Set a name and reference

###### Add a new contract
```bash
mk add contract
```
Set a name, symbol and choose the contract type: ERC20 - Mintable

Tips: After that, you could do: mk or mk info contract

###### Mint tokens
```bash
mk mint token
```
Set the recipient wallet and set the number of tokens to mint

Tips: After that, you could do: mk info contract or mk info token

###### Transfer tokens
```bash
mk transfer token
```
The origin wallet will be the selected wallet. Type: mk
- To change the wallet: mk select wallet
  
Set the recipient wallet and set the number of tokens to mint

Tips: After that, you could do: mk info contract or mk info token

### NFT Collection
###### Add a new Wallet to project
```bash
mk add wallet
```
Set a name and reference

###### Add a new contract
```bash
mk add contract
```
Set a name, symbol and choose the contract type: 
- ERC721 - Mutable URI (NFT, URI points to MintKnight)
- ERC721 - Inmutable URI (NFT, URI points to Arweave)

Tips: After that, you could do: mk or mk info contract

###### Add a media
```bash
mk add media <image path>
```
Example <image path>: assets/prize1.png

Tips: After that, you could do: mk list media

###### Mint a NFT
```bash
mk mint nft
```
Set the media ID for the image, name, description, atrributes and choose the recipient wallet

Tips: After that, you could do: mk list nft

###### Transfer a NFT
```bash
mk transfer nft
```
The origin wallet will be the selected wallet. Type: mk
- To change the wallet: mk select wallet
  
Set NFT ID, and the recipient wallet

### Drops
###### Add a new Wallet to project
```bash
mk add signer
```
Set a name and reference

###### Add a new contract
```bash
mk add contract
```
Set a name, symbol and choose the contract type: 
- ERC721 - Mutable URI (NFT, URI points to MintKnight)
- ERC721 - Inmutable URI (NFT, URI points to Arweave)

Tips: After that, you could do: mk or mk info contract

###### Add a new drop
```bash
mk add drop
```
Set a name, description and the next params:
- Drop type: 
    - First come first Served: Mint the first NFT ready to be minted.
    - Raffle: Mint random NFT of drop collection.
- Uses codes: Yes/No. If 'Yes', create drop codes will be a requirement to mint NFTs.
- Direct minting: Yes/No. If 'Yes', the NFTs will be free, otherwise the end user, will have to pay de minted cost and the price of the NFT.
- Price (optional)
- Coin (optional)
- Start date and end date: Availability date range of drop

Tips: After that, you could do: mk list drop

###### Upload NFTs to drop
```bash
mk upload nft
```
Set the path of csv file and images zip collection
- CSV format example:
```
tokenId;name;description;image;price;coin
1;NFT 1;My NFT 1;mynft.png;20;MATIC
2;WNFT;Wonderful NFT 2;wonderfulnft.png;20;USDC
```
- The zip file must contain inside all the images: mynft.png, wonderfulnft.png, etc.

Tips: After that, you could do: mk list nft

###### Upload drop codes
```bash
mk list drop
mk add/upload dropcode
```
Set the Drop ID and the csv file which contains the codes
- CSV format example:
```
code;maxUsage;
ABCD1;1
ABCD2;1
```
- The maxUsage is the number of times, the code could be used

Tips: After that, you could do: mk list dropcode