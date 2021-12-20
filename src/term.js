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

const proceed = async () => {
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

const promptSecret = async () => {
  const questions = [
  {
    type: 'password',
    name: 'secret',
    message: 'Your password'
  }];
  const answers = await prompt(questions, {onCancel:cleanup, onSubmit:cleanup});
  return answers.secret;
}

const promptUser = async (label) => {
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

const promptProject = async () => {
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
      { title: 'mintknight', description: 'MinktKnight evm test network', value: 'mintknight' },
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

const selectProject = async (choices) => {
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

const inputText = async (message) => {
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

const detail = (label, value1, network = false) => {
  let color = '';
  switch (network) {
    case 'mintknight': color = '#32afff'; break;
    case 'mumbai': color = '#34e2e2'; break;
    case 'polygon': color = '#4e9a06'; break;
  }
  log(chalk.hex('#FFA500').bold(label) + ': ' + value1 + ((network === false) ? '' : chalk.hex(color).bold(` (${network})`)));
}
module.exports = {log, title, error, warning, detail, proceed, promptUser, promptProject, selectProject, inputText}

