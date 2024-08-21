const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const votesFilePath = path.join(__dirname, '../../../cache/v1/votes.json');

router.get('/:id', (req, res) => {
    const userId = req.params.id;
    const botId = req.query.bot;

    fs.readFile(votesFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read votes file' });
        }

        let votesData;
        try {
            votesData = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).json({ error: 'Failed to parse votes data' });
        }

        if (!votesData[botId]) {
            return res.status(404).json({ error: 'Bot not found' });
        }

        const userVote = votesData[botId].votes.find(vote => vote[userId]);

        if (userVote) {
            return res.json(userVote[userId]);
        } else {
            return res.status(404).json({ error: 'This user has not voted for this bot' });
        }
    });
});

module.exports = router;
