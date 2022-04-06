require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');

const { YTSearcher } = require('ytsearcher');

const searcher = new YTSearcher({
	key: process.env.youtube_api,
	revealed: true,
});

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();

fs.readdir('./commands/', (err, files) => {
	if (err) console.log(err);

	files.forEach((file) => {
		if (!file.endsWith('.js')) return;
		let cmd = require(`./commands/${file}`);
		let cmdName = cmd.config.name;
		client.commands.set(cmdName, cmd);
		cmd.config.aliases.forEach((alias) => {
			client.aliases.set(alias, cmdName);
		});
	});
});

const queue = new Map();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);

	client.user.setActivity('!help', {
		type: 'WATCHING',
	});
});

client.on('message', async (message) => {
	const { prefix } = require('./json/config.json');

	let prefixes = JSON.parse(fs.readFileSync('./json/prefixes.json', 'utf-8'));

	if (!prefixes[message.guild.id]) {
		prefixes[message.guild.id] = {
			prefixes: prefix,
		};
	}

	let prefixNew = prefixes[message.guild.id].prefixes;

	const args = message.content.slice(prefix.length).trim().split(/ +/g);

	const command = args.shift().toLowerCase();

	if (!message.content.startsWith(prefixNew) || message.author.bot) return;

	const cmd =
		client.commands.get(command) ||
		client.commands.get(client.aliases.get(command));

	if (!cmd) return;

	try {
		cmd.run(client, message, args, queue, searcher, prefixNew);
	} catch (err) {
		return console.error(err);
	}
});

client.login(process.env.token);
