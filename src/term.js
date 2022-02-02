const prompt = require('prompts');
const chalk = require('chalk');

let interval;

const cleanup = () => {
  clearInterval(interval);
}

const log = console.log;

const title = (...args) => {
  log(chalk.bold.green.bold(args));
}

const error = (...args) => {
  log(chalk.bold.red(args) + '\n');
  process.exit(1);
}

const warning = (...args) => {
  log(chalk.hex('#FFA500').bold(args));
}

const detail = (label, value1, network = false) => {
  let color = '';
  switch (network) {
    case 'localhost': color = '#32afff'; break;
    case 'mumbai': color = '#34afff'; break;
    case 'polygon': color = '#4e9a06'; break;
  }
  log(chalk.hex('#FFA500').bold(label) + ': ' + value1 + ((network === false) ? '' : chalk.hex(color).bold(` (${network})`)));
}

class Select {
  static async project(choices) {
    warning('\nSelect Project');
    const questions = [
    {
      type: 'select',
      name: 'project',
      message: 'Choose a project',
      choices
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.project === undefined) process.exit();
    return answers.project;
  }

  static async wallet(choices) {
    warning('\nSelect Wallet');
    const questions = [
    {
      type: 'select',
      name: 'wallet',
      message: 'Choose a Wallet',
      choices
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.wallet === undefined) process.exit();
    return answers.wallet;
  }

  static async contract(choices) {
    warning('\nSelect Contract');
    const questions = [
    {
      type: 'select',
      name: 'contract',
      message: 'Choose a Contract',
      choices
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.contract === undefined) process.exit();
    return answers.contract;
  }

}

class Prompt {
  static async text(message) {
    const questions = [
    {
      type: 'text',
      name: 'name',
      message,
    }]
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.name === undefined ) process.exit();
    return answers.name;
  }

  static async proceed() {
    const questions = [{
      type: 'toggle',
      name: 'value',
      message: 'Do you want to continue?',
      initial: true,
      active: 'yes',
      inactive: 'no'
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (!answers.value) process.exit(0);
  }

  static async secret() {
    const questions = [
    {
      type: 'password',
      name: 'secret',
      message: 'Your password'
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    return answers.secret;
  }

  static async env (label) {
    warning(`\n${label}`);
	const questions = [
    {
      type: 'select',
      name: 'env',
      message: 'Choose an environment',
      choices: [
        { title: 'local', description: 'Local - devel environment', value: 'local' },
        // { title: 'sandbox', description: 'Sandbox - test features', value: 'sandbox' },
        { title: 'production', description: 'Production ', value: 'production' },
      ]
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.env === undefined) process.exit();
    return answers.env;
  }

  static async user (label) {
    warning(`\n${label}`);
    const questions = [
    {
      type: 'text',
      name: 'email',
      message: `What's your email?`,
    },
    {
      type: 'password',
      name: 'password',
      message: 'Your password'
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.email === undefined || answers.password === undefined ) process.exit();
    return answers;
  }

  static async project (env) {
    warning('\nProject information');
    const questions = [
    {
      type: 'text',
      name: 'name',
      message: `What's the name of the project?`,
    },
    {
      type: 'select',
      name: 'network',
      message: 'Choose a network',
      choices: [
        { title: 'mumbai', description: 'Polygon testnet', value: 'mumbai' },
        { title: 'polygon', description: 'Polygon mainnet', value: 'polygon' },
      ]
    }];
	  if (env === 'local') {
      questions[1].choices.push({title: 'localhost', description: 'Ganache local network', value: 'localhost' });
	  }
	  
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.name=== undefined || answers.network=== undefined) process.exit();
    return answers;
  }


  static async wallet(project) {
    warning(`\nAdd a new Wallet to project ${project} `);
    const questions = [
    {
      type: 'text',
      name: 'name',
      message: `What's the name of the wallet?`,
    }, {
      type: 'text',
      name: 'ref',
      message: `Internal reference of the wallet`,
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.name=== undefined || answers.ref=== undefined) process.exit();
    return answers;
  }

  static async contract() {
    warning('\nContract information');
    const questions = [
    {
      type: 'text',
      name: 'name',
      message: `What's the name of the Contract?`,
    },
	{
      type: 'text',
      name: 'symbol',
      message: `What's the symbol of the Contract?`,
    },
    {
      type: 'select',
      name: 'contractType',
      message: 'Choose a contract Type',
      choices: [
        { title: 'erc20', description: 'Fungible Token (ERC20)', value: 1 },
        { title: 'erc721 Mutable URI', description: 'Non Fungible Token (ERC721), URI points to MintKnight', value: 2 },
        { title: 'erc721 Inmutable URI', description: 'Non Fungible Token (ERC721), URI points to Arweave', value: 3 },
      ]
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.name === undefined || answers.symbol === undefined || answers.contractType === undefined)
	  process.exit();
    return answers;
  }

  static async attribute() {
    warning('\nAdd Attribute');
    let questions = [{
      type: 'select',
      name: 'attributeType',
      message: 'Add a new Attribute',
      choices: [
        { title: 'no attributes', description: 'No more attributes (end)', value: 'no' },
        { title: 'text', description: 'Attribute is a Text', value: 'text' },
        { title: 'number', description: 'Attribute is a Number', value: 'number' },
        { title: 'boost_percentage', description: 'Attribute is a %', value: 'boost_percentage' },
        { title: 'boost_number', description: 'Attribute is a Number (limits)', value: 'boost_number' },
        { title: 'date', description: 'Attribute is a Date', value: 'date' },
      ]
    }];
    let answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    (answers.attributeType === undefined) && process.exit();
    if (answers.attributeType === 'no') return false;
    const attribute = {};
  	if (answers.attributeType !== 'text') attribute.display_type = answers.attributeType;
	  questions = [
    {
      type: 'text',
      name: 'trait_type',
      message: 'Trait Type (description)',
  	},
    {
      type: 'text',
      name: 'value',
      message: 'Trait Value',
    }];
    answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    (answers.trait_type === undefined || answers.value === undefined) && process.exit();
	  attribute.trait_type = answers.trait_type;
	  attribute.value = answers.value;
    return attribute;
  }

  static async nft() {
    warning('\nNFT metadata');
    const questions = [
    {
      type: 'text',
      name: 'media',
      message: `Media Id (mk list media)`,
    },
    {
      type: 'text',
      name: 'name',
      message: `Name`,
    },
	  {
      type: 'text',
      name: 'description',
      message: `Description`,
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    (answers.name === undefined || answers.description === undefined) && process.exit();
    answers.attributes = [];
    let attribute = true;
    while (attribute !== false) {
	    attribute = await Prompt.attribute();
      (attribute !== false) && answers.attributes.push(attribute);
  	}
    return answers;
  }



}

module.exports = {log, title, error, warning, detail, Prompt, Select}

