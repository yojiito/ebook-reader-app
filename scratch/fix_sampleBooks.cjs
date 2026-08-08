const fs = require('fs');
const path = require('path');

const sampleBooksPath = path.resolve('src/data/sampleBooks.ts');
const uploadedTextPath = 'C:\\Users\\n1451\\.gemini\\antigravity\\brain\\fd945ada-c2af-4483-bcc1-750df4bb446f\\.user_uploaded\\media_1786159837903.txt';

let lines = fs.readFileSync(sampleBooksPath, 'utf8').split('\n');
let newText = fs.readFileSync(uploadedTextPath, 'utf8');

// Find the line that starts with export const SAMPLE_TEXT_WEALTH_HAPPINESS
const lineIndex = lines.findIndex(l => l.startsWith('export const SAMPLE_TEXT_WEALTH_HAPPINESS'));

if (lineIndex === -1) {
    console.error('Could not find SAMPLE_TEXT_WEALTH_HAPPINESS');
    process.exit(1);
}

// Escape backticks and ${} just in case
const escapedText = newText.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

lines[lineIndex] = `export const SAMPLE_TEXT_WEALTH_HAPPINESS = \`${escapedText}\`;`;

fs.writeFileSync(sampleBooksPath, lines.join('\n'), 'utf8');
console.log('Successfully fixed sampleBooks.ts');
