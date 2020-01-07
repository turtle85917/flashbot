/**
 * @name bot.js
 * @description Main Bot Script
 */

/**
 * config file
 */

const VERSION = "v0.7.1";
const BUILD_DATE = "2019/11/13"

let configFile;

// import needed modules
const fs = require('fs');
const path = require('path');
const Commando = require('discord.js-commando');

if (fs.existsSync('./config.json')) {
    /**
     * config file
     */
    configFile = require('./config.json');
} else {
    configFile = {};
    configFile.owner = null;
    configFile.commandPrefix = null;
    configFile.db = null;
}

const config = {
    owner: configFile.owner || process.env.owner,
    commandPrefix: configFile.prefix || process.env.prefix,
    db: configFile.db || process.env.db
}

// necessary config check

for(let i = 0; i < Object.keys(config).length; i++) {
    if(!config[Object.keys(config)[i]]) {
        throw new Error(`Config ${Object.keys(config)[i]} does not exist`);
    }
}

/**
 * Main Client
 * @type {CommandoClient}
 */
const client = new Commando.Client({
    owner: config.owner,
    commandPrefix: config.commandPrefix,
    unknownCommandResponse: false
});

/**
 * Database
 */
switch (config.db.type) {
    case 'json': {
        let req = require('./db/json');
        var db = new req('./db/db.json');
        client.setProvider(db);
	break
    }
    case 'mysql': {
        let provider = require('./db/mysql')
	let db = new provider(config.db.connection)
	client.setProvider(db)
	break
    }
}

/**
 * i18n
 */
const i18n = require('i18n');
i18n.configure({
    directory: './lang',
    objectNotation: true,
    syncFiles: true,
    autoReload: true,
    logDebugFn: (msg) => console.log(`[i18n/Debug] ${msg}`),
    logWarnFn: (msg) => console.warn(`[i18n/WARN] ${msg}`),
    logErrorFn: (msg) => console.log(`[i18n/ERROR] ${msg}`)
});
i18n.__ll = async (phrase, guild) => {
    return i18n.__({
        phrase: phrase,
        locale: await client.getGuildLocale(guild)
    });
};

client.getGuildLocale = async (guild) => {
  let locale = await client.provider.get('guilds', guild.id, 'lang') || 'en';
  return locale.length > 0 ? locale[0].lang : 'en'
};

/**
 * Bot token
 * @type {string}
 * @private
 */
const token = process.env.token || require('./token.json').token;

// Ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({ status: 'online', game: { name: `${config.commandPrefix}help` } });
});

// Login to Discord
client.login(token);

// Commando: Register Defaults
client.registry
    .registerDefaults()
    .registerGroups([
        ['dev', 'Commands for developing'],
        ['misc', 'Misc'],
        ['info', 'Provides several informations'],
        ['activation', 'activating/deactivating the bot on the server'],
	['memo', 'memo']
    ])
    .registerCommandsIn(path.join(__dirname, 'commands'));

// for debug purposes
client.on('message', msg => {
    if (msg.guild) {
        console.log(`${msg.guild.name} > ${msg.channel.name} > ${msg.author.username} (${msg.webhookID ? 'null' : msg.member.nickname}) > ${msg.content}`);
    } else {
        console.log(`DM (${msg.channel.id}) > ${msg.author.username} > ${msg.content}`);
    }
});

// web server (Heroku web dyno placeholder)
const express = require('express');
const app = express();
/**
 * web server port
 * @type {number}
 */
const PORT = process.env.PORT || 5000;

app.use(express.static('public'));
app.listen(PORT, () => console.log(`Web server on port ${PORT}`));

