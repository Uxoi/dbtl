require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits } = require('discord.js');
const router = express.Router();

const votesFilePath = path.join(__dirname, '../../../cache/v1/votes.json');
const GUILD_ID = '1275535499007627436';
const ROLE_ID = '1275619408303358083';
const COOLDOWN_TIME = 60 * 1000; // 1 minute in milliseconds

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Authenticate the bot
client.login(process.env.DISCORD_BOT_TOKEN);

// When the bot is ready
client.once('ready', () => {
    console.log('Bot is connected');
});

router.get('/:botID', async (req, res) => {
    const botID = req.params.botID;
    const userID = req.query.user;

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        return res.status(500).json({ error: 'Unknown error' });
    }

    try {
        const botMember = await guild.members.fetch(botID);

        if (!botMember.roles.cache.has(ROLE_ID)) {
            return res.status(403).json({ error: 'This bot does not have the required role' });
        }

        const userMember = await guild.members.fetch(userID);
        if (!userMember) {
            return res.status(404).json({ error: 'User not found' });
        }

        let votesData;
        try {
            const data = fs.readFileSync(votesFilePath, 'utf8');
            votesData = JSON.parse(data);
        } catch (err) {
            votesData = {};
        }

        if (!votesData[botID]) {
            votesData[botID] = { votes: [], amount: 0 };
        }

        const existingVote = votesData[botID].votes.find(vote => vote[userID]);

        if (existingVote) {
            const lastVoteTime = new Date(existingVote[userID].timestamp);
            const currentTime = new Date();

            if (currentTime - lastVoteTime < COOLDOWN_TIME) {
                const remainingTime = COOLDOWN_TIME - (currentTime - lastVoteTime);
                return res.status(429).json({ error: `You need to wait ${Math.ceil(remainingTime / 1000)} seconds before voting again` });
            }

            existingVote[userID].timestamp = currentTime.toISOString();
        } else {
            const newVote = {};
            newVote[userID] = { vote: true, timestamp: new Date().toISOString(), expired: false };
            votesData[botID].votes.push(newVote);
            votesData[botID].amount += 1;
        }

        fs.writeFileSync(votesFilePath, JSON.stringify(votesData, null, 2), 'utf8');

        return res.json({ success: true, message: 'Vote registered successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred while processing the vote' });
    }
});

module.exports = router;