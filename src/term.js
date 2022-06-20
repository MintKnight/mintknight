const prompt = require('prompts');
const chalk = require('chalk');

let interval;

const cleanup = () => {
  clearInterval(interval);
};

const log = console.log;

const title = (...args) => {
  log(chalk.bold.green.bold(args));
};

const error = (...args) => {
  log(chalk.bold.red(args) + '\n');
  process.exit(1);
};

const errorNoExit = (...args) => {
  log(chalk.bold.red(args) + '\n');
};

const warning = (...args) => {
  log(chalk.hex('#FFA500').bold(args));
};

const check = (args) => {
  log(args, chalk.hex('#00FF00').bold('OK'));
};

const detail = (label, value1, network = false) => {
  let color = '';
  switch (network) {
    case 'localhost':
      color = '#32afff';
      break;
    case 'mumbai':
      color = '#34afff';
      break;
    case 'polygon':
      color = '#4e9a06';
      break;
  }
  log(
    chalk.hex('#FFA500').bold(label) +
      ': ' +
      value1 +
      (network === false ? '' : chalk.hex(color).bold(` (${network})`))
  );
};

class Select {
  static async project(choices) {
    warning('\nSelect Project');
    const questions = [
      {
        type: 'select',
        name: 'project',
        message: 'Choose a project',
        choices,
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
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
        choices,
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
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
        choices,
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.contract === undefined) process.exit();
    return answers.contract;
  }

  static async option(choices, askTitle = 'Choose an option') {
    warning('\nSelect and option');
    const questions = [
      {
        type: 'select',
        name: 'option',
        message: askTitle,
        choices,
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.option === undefined) process.exit();
    return answers.option;
  }
}

class Prompt {
  static async text(message) {
    const questions = [
      {
        type: 'text',
        name: 'name',
        message,
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.name === undefined) process.exit();
    return answers.name;
  }

  static async proceed() {
    const questions = [
      {
        type: 'toggle',
        name: 'value',
        message: 'Do you want to continue?',
        initial: true,
        active: 'yes',
        inactive: 'no',
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (!answers.value) process.exit(0);
  }

  static async secret() {
    const questions = [
      {
        type: 'password',
        name: 'secret',
        message: 'Your password',
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    return answers.secret;
  }

  static async env(label) {
    warning(`\n${label}`);
    const questions = [
      {
        type: 'select',
        name: 'env',
        message: 'Choose an environment',
        choices: [
          {
            title: 'local',
            description: 'Local - devel environment',
            value: 'local',
          },
          {
            title: 'sandbox',
            description: 'Sandbox - staging environment',
            value: 'sandbox',
          },
          {
            title: 'production',
            description: 'Production ',
            value: 'production',
          },
        ],
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.env === undefined) process.exit();
    return answers.env;
  }

  static async user(label) {
    warning(`\n${label}`);
    const questions = [
      {
        type: 'text',
        name: 'email',
        message: "What's your email?",
      },
      {
        type: 'password',
        name: 'password',
        message: 'Your password',
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.email === undefined || answers.password === undefined)
      process.exit();
    return answers;
  }

  static async project(env) {
    warning('\nProject information');
    const questions = [
      {
        type: 'text',
        name: 'name',
        message: "What's the name of the project?",
      },
      {
        type: 'text',
        name: 'thumb',
        message: "'Thumbnail Image? ./assets/thumbnail.jpg'",
      },
      {
        type: 'select',
        name: 'network',
        message: 'Choose a network',
        choices: [
          { title: 'mumbai', description: 'Polygon testnet', value: 'mumbai' },
          {
            title: 'polygon',
            description: 'Polygon mainnet',
            value: 'polygon',
          },
        ],
      },
    ];
    if (env === 'local') {
      questions[2].choices.push({
        title: 'localhost',
        description: 'Ganache local network',
        value: 'localhost',
      });
    }

    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.name === undefined || answers.network === undefined)
      process.exit();
    return answers;
  }

  static async wallet(project, walletType) {
    warning(`\nAdd a new Wallet to project ${project} `);
    const questions = [
      {
        type: 'text',
        name: 'name',
        message: "What's the name of the wallet?",
      },
      {
        type: 'text',
        name: 'refUser',
        message: 'Internal reference of the wallet',
      },
    ];
    /*
    if (walletType == 'onchain') {
      questions.push({
        type: 'select',
        name: 'deploy',
        message: 'Deploy wallet after saving or not',
        choices: [
          { title: 'Yes', description: 'Deploy wallet', value: true },
          { title: 'No', description: 'Not to deploy wallet', value: false },
        ],
      });
    }
    */
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.name === undefined || answers.refUser === undefined)
      process.exit();
    return answers;
  }

  static async getWalletId(nconf, env, projectId) {
    warning('\nChoose a wallet');
    const wallets = nconf.get(`${env}:${projectId}:wallets`);
    const choices = [];
    for (let i = 0; i < wallets.length; i += 1) {
      const wallet = nconf.get(`${env}:${projectId}:${wallets[i]}`);
      const choice = {
        title: wallet.name,
        description: `${wallet.name} (${wallet.address})`,
        value: wallets[i],
      };
      choices.push(choice);
    }
    choices.push({
      title: '-- Input a WalletId',
      description: 'A Mintknight Wallet',
      value: 'walletId',
    });
    choices.push({
      title: '-- Use an Address',
      description: 'Network public address',
      value: 'address',
    });
    let walletId = await Select.wallet(choices);
    let address = '';
    if (walletId === 'walletId') {
      walletId = await Prompt.text('WalletId');
    } else if (walletId === 'address') {
      walletId = 0;
      address = await Prompt.text('Address');
    }
    return { walletId, address };
  }

  static async contract() {
    warning('\nContract information');
    const questions = [
      {
        type: 'text',
        name: 'name',
        message: "What's the name of the Contract?",
      },
      {
        type: 'text',
        name: 'thumb',
        message: "'Thumbnail Image? ./assets/thumbnail.jpg'",
      },
      {
        type: 'text',
        name: 'symbol',
        message: "What's the symbol of the Contract?",
      },
      {
        type: 'select',
        name: 'contractType',
        message: 'Choose a contract Type',
        choices: [
          {
            title: 'ERC721 - Mutable URI',
            description: 'NFT, URI points to MintKnight',
            value: 51,
          },
          {
            title: 'ERC721 - Inmutable URI',
            description: 'NFT, URI points to Arweave',
            value: 52,
          },
          {
            title: 'ERC20 - Mintable',
            description: 'Fungible Token (ERC20)',
            value: 10,
          },
          /*
          {
            title: 'ERC721 - Buyable',
            description:
              'NFT - Can be minted by a different contract (Buy/Auction)',
            value: 53,
          },
          {
            title: 'ERC721 - HiddenURI',
            description:
              'NFT - Initially URI is hidden and it will be revealed as a secret',
            value: 54,
          },
          {
            title: 'BUY - Buy contracts',
            description: 'Used to buy from another contract',
            value: 100,
          },*/
        ],
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    answers.contractId = false;
    if (answers.contractType === 100) {
      answers.contractId = await Prompt.text('ContractId (ERC721)');
      answers.mediaId = await Prompt.text('mediaId (default img)');
    }
    if (
      answers.name === undefined ||
      answers.symbol === undefined ||
      answers.contractType === undefined
    )
      process.exit();
    return answers;
  }

  static async attribute() {
    warning('\nAdd Attribute');
    let questions = [
      {
        type: 'select',
        name: 'attributeType',
        message: 'Add a new Attribute',
        choices: [
          {
            title: 'no attributes',
            description: 'No more attributes (end)',
            value: 'no',
          },
          { title: 'text', description: 'Attribute is a Text', value: 'text' },
          {
            title: 'number',
            description: 'Attribute is a Number',
            value: 'number',
          },
          {
            title: 'boost_percentage',
            description: 'Attribute is a %',
            value: 'boost_percentage',
          },
          {
            title: 'boost_number',
            description: 'Attribute is a Number (limits)',
            value: 'boost_number',
          },
          { title: 'date', description: 'Attribute is a Date', value: 'date' },
        ],
      },
    ];
    let answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.attributeType === undefined) process.exit();
    if (answers.attributeType === 'no') return false;
    const attribute = {};
    if (answers.attributeType !== 'text')
      attribute.display_type = answers.attributeType;
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
      },
    ];
    answers = await prompt(questions, { onCancel: cleanup, onSubmit: cleanup });
    if (answers.trait_type === undefined || answers.value === undefined)
      process.exit();
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
        message: 'Media Id (mk list media)',
      },
      {
        type: 'text',
        name: 'name',
        message: 'Name',
      },
      {
        type: 'text',
        name: 'description',
        message: 'Description',
      },
    ];
    const answers = await prompt(questions, {
      onCancel: cleanup,
      onSubmit: cleanup,
    });
    if (answers.name === undefined || answers.description === undefined)
      process.exit();
    answers.attributes = [];
    let attribute = true;
    while (attribute !== false) {
      attribute = await Prompt.attribute();
      if (attribute !== false) answers.attributes.push(attribute);
    }
    return answers;
  }
}

module.exports = {
  log,
  title,
  error,
  errorNoExit,
  warning,
  detail,
  check,
  Prompt,
  Select,
};
