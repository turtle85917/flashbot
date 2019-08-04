/**
 * @name bot.js
 * @description Main Bot Script
 */

/**
 * config file
 */
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
}

const config = {
    owner: configFile.owner || process.env.owner,
    commandPrefix: configFile.prefix || process.env.prefix,
    db: configFile.db || process.env.db
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
switch (config.db) {
    case 'json': {
        let req = require('./db/json');
        var db = new req('./db/db.json');
        client.setProvider(db);
    }
}

/**
 * i18n
 */
const i18n = require('i18n');
i18n.configure({
    directory: './lang',
    objectNotation: true
});

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
        ['activation', 'activating/deactivating the bot on the server']
    ])
    .registerCommandsIn(path.join(__dirname, 'commands'));

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