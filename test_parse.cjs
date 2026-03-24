const fs = require('fs');
const Papa = require('papaparse');

const tempoCsv = fs.readFileSync('public/RUI Time.csv', 'utf8');
const jiraCsv = fs.readFileSync('public/RUI jira.csv', 'utf8');

const tempoData = Papa.parse(tempoCsv, { header: true, skipEmptyLines: true }).data;
const jiraData = Papa.parse(jiraCsv, { header: true, skipEmptyLines: true }).data;

const getVal = (row, possibleKeys) => {
    const rowKeys = Object.keys(row);
    for (const pKey of possibleKeys) {
        const pKeyLower = pKey.toLowerCase();
        const foundKey = rowKeys.find(k => k.trim().toLowerCase() === pKeyLower);
        if (foundKey) return row[foundKey];
    }
    return undefined;
};

const tempoStats = {}; 
tempoData.forEach(row => {
    const username = getVal(row, ['username', 'user', 'worker']);
    const date = getVal(row, ['work date', 'date', 'date started']);
    const hours = parseFloat(getVal(row, ['hours', 'hours logged', 'time spent (h)']) || 0);
    
    if (username && date && hours > 0) {
        if (!tempoStats[username]) tempoStats[username] = new Set();
        tempoStats[username].add(date.split(' ')[0]);
    }
});

const jiraStats = {};
jiraData.forEach(row => {
    const assignee = getVal(row, ['assignee']);
    const sp = parseFloat(getVal(row, ['custom field (story points)', 'story points']) || 0);
    
    if (assignee && sp > 0) {
        if (!jiraStats[assignee]) jiraStats[assignee] = 0;
        jiraStats[assignee] += sp;
    }
});

console.log("Tempo stats:", Array.from(Object.entries(tempoStats)).map(([k, v]) => `${k}: ${v.size} days`));
console.log("Jira stats:", jiraStats);

