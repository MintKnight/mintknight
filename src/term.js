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
    case 'mumbai': color = '#34e2e2'; break;
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
    if (answers.email === undefined || answers.password === undefined) process.exit();
    return answers;
  }

  static async project () {
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
        { title: 'localhost', description: 'Ganache local network', value: 'localhost' },
        { title: 'mumbai', description: 'Polygon testnet', value: 'mumbai' },
        { title: 'polygon', description: 'Polygon mainnet', value: 'polygon' },
 //     { title: 'rinkeby', description: 'Ethereum testnet', value: 'rinkeby' },
 //     { title: 'mainnet', description: 'Ethereum mainnet', value: 'mainnet' },
      ]
    }];
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
        { title: 'erc721', description: 'Non Fungible Token (ERC721)', value: 2 },
        { title: 'voucher - whitelist', description: 'Voucher - Whitelist', value: 3 },
        { title: 'voucher - code', description: 'Voucher - Codes', value: 4 },
      ]
    }];
    const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
    if (answers.name === undefined || answers.symbol === undefined || answers.contractType === undefined)
	  process.exit();
    return answers;
  }

}

module.exports = {log, title, error, warning, detail, Prompt, Select}

