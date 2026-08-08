const fs = require('fs');
const path = require('path');

const sampleBooksPath = path.resolve('src/data/sampleBooks.ts');
const uploadedTextPath = 'C:\\Users\\n1451\\.gemini\\antigravity\\brain\\fd945ada-c2af-4483-bcc1-750df4bb446f\\.user_uploaded\\media_1786159837903.txt';

let sampleBooksContent = fs.readFileSync(sampleBooksPath, 'utf8');
let newText = fs.readFileSync(uploadedTextPath, 'utf8');

// Escape backticks if we use them
const escapedText = newText.replace(/`/g, '\\`');

const markerStart = 'export const SAMPLE_TEXT_WEALTH_HAPPINESS = "';
const altMarkerStart = 'export const SAMPLE_TEXT_WEALTH_HAPPINESS = `';

let startIndex = sampleBooksContent.indexOf(markerStart);
let isTemplateLiteral = false;

if (startIndex === -1) {
    startIndex = sampleBooksContent.indexOf(altMarkerStart);
    if (startIndex !== -1) isTemplateLiteral = true;
} else {
    // Current file uses " for this text. Let's switch it to ` to avoid massive escaping issues
}

if (startIndex === -1) {
    console.error('Could not find SAMPLE_TEXT_WEALTH_HAPPINESS export');
    process.exit(1);
}

// Find the line before the export
const exportStatement = 'export const SAMPLE_TEXT_WEALTH_HAPPINESS =';
const exportIndex = sampleBooksContent.indexOf(exportStatement);
const textBefore = sampleBooksContent.substring(0, exportIndex);

// We will just rewrite the rest of the file from that point
const newFileContent = textBefore + `export const SAMPLE_TEXT_WEALTH_HAPPINESS = \`${escapedText}\`;\n`;

fs.writeFileSync(sampleBooksPath, newFileContent, 'utf8');
console.log('Successfully updated sampleBooks.ts');
