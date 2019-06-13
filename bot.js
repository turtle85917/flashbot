/**
 * @name bot.js
 * @description Main Bot Script
 */

const fs = require('fs');
const Discord = require('discord.js');
const client = new Discord.Client();

const config = require('./config.json');
const db = require('./firebase');

/**
 * @todo i18n system
 */

/**
 * 개발자 모드
 */
var devMode = false;

// arguments
process.argv.forEach((val, index) => {
    if (index >= 2 && val === '--dev') {
        devMode = true;
    }
});

console.log(`devMode = ${devMode}`);

client.commands = new Discord.Collection();
const token = process.env.token || require('./token.json').token;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    if (devMode) {
        client.user.setPresence({ status: 'online', game: { name: `${config.prefix}help | DEV Mode` } });
    } else {
        client.user.setPresence({ status: 'online', game: { name: `${config.prefix}help` } });
    }
});

client.login(token);

const commands = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));
for (const file of commands) {
    const cmd = require(`./commands/${file}`);
    if (!(!devMode && cmd.dev)) {
        client.commands.set(cmd.name, cmd);
        
        // call by ref
        cmd.callSign.forEach((callSign) => {
            client.commands.set(callSign, cmd);
        });
    }
}

client.on('message', (msg) => {
    if (devMode) {
        console.log(msg);
    } else {
        console.log(msg.content);
    }

    if (!msg.content.startsWith(config.prefix) || msg.author.bot) {
        return;
    }

    const args = msg.content.slice(config.prefix.length).split(/ +/); //regex
    const command = args.shift().toLowerCase();
    const input = msg.content.slice(config.prefix.length + command.length);

    if (!client.commands.has(command)) {
        return;
    }

    try {
        /**
         * 명령어 객체
         */
        const cmd = client.commands.get(command);

        // 특정 데이터가 필요한 명령어는 처리 방식 분리
        if (command === 'help' || command === '도움말') {
            cmd.execute(msg, args, client.commands, devMode);
        } else if (command === 'eval' || command === 'say' || command === '말하기') {
            cmd.execute(msg, input);
        } else {
            // 나머지는 한 번에 처리
            cmd.execute(msg, args);
        }
    } catch (error) {
        console.error(error);
        msg.reply('명령어를 실행하는 도중에 오류가 발생했습니다.');
    }
});

// web server
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('public'));
app.listen(PORT, () => console.log(`Web server on port ${PORT}`));