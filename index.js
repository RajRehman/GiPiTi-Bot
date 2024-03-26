require('dotenv/config');
const { Client } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'],
});

client.on('ready', () => {
    console.log('The bot is online');
});

const COMMAND_PREFIX = "!gpt"; //command to trigger bot
//const CHANNELS = ['1194212732392718419']

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
})


client.on('messageCreate', async(message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(COMMAND_PREFIX)) return;
    //if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id) ) return;

    // Remove the command from the message content
    const commandBody = message.content.slice(COMMAND_PREFIX.length);
    const cleanMessage = commandBody.trim();

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping();
    }, 5000); //can change val

    let conversation = [];
    conversation.push({
        role: 'system',
        content: 'Chat GPT is a friendly bot'
    });

    let prevMessages = await message.channel.messages.fetch({ limit: 10 });
    prevMessages.reverse();

    prevMessages.forEach((msg) => {
        if (msg.author.bot && msg.author.id !== client.user.id) return;
        //if (msg.content.startsWith(COMMAND_PREFIX)) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content,
            });

            return;
        }

        // Include the command message in the conversation history
        let content = msg.content;
        if (msg.content.startsWith(COMMAND_PREFIX)) {
            content = msg.content.slice(COMMAND_PREFIX.length).trim();
        }

        conversation.push({
            role: 'user',
            name: username,
            content: msg.content,
        });
    })

    const response = await openai.chat.completions
        .create({
            model: 'gpt-3.5-turbo',
            messages: conversation,
        })
        .catch((error) => console.error('OpenAI Error:\n', error));
    
    clearInterval(sendTypingInterval);
    
    if (!response){
        message.reply("Sorry, I'm having trouble understanding you right now. Please try again later.");
        return;
    }

    const responseMessage = response.choices[0].message.content;
    const chunkSizeLimit = 2000;

    for (let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
        const chunk = responseMessage.substring(i, i + chunkSizeLimit);

        await message.reply(chunk);
    }


});


client.login(process.env.TOKEN);