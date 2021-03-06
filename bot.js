const Discord = require('discord.js');
const fs = require('fs');
const { token, prefix } = require('./bot/config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();

//EVENT + COMMAND HANDLER
const commandFiles = fs.readdirSync('./handlers/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./handlers/commands/${file}`);
    
    try {
        client.commands.set(command.name, command);
    } catch(err) {
        console.error(err);
    }
}



fs.readdir('./handlers/events', (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        const eventFunction = require(`./handlers/events/${file}`);
        if (eventFunction.disabled) return;

        const event = eventFunction.event || file.split('.')[0];
        const emitter = (typeof eventFunction.emitter == 'string' ? client[eventFunction.emitter] : eventFunction.emitter) || client;
        const once = eventFunction.once;

        try {
            emitter[once ? 'once' : 'on'](event, (...args) => eventFunction.run(client, ...args))
        } catch (error) {
            console.error(error.stack);
        }
    });
});
//EVENT + COMMAND HANDLER

client.on("message", async message => {

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) ||
        client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.guildOnly && message.channel.type !== 'text') {
        return message.reply("I can\'t execute that command in DMs!");
    }

    try {
        command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
})

client.login(token);