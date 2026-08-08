const fs = require('fs');

const KINSOKU_HEAD_NOT_ALLOWED = new Set(['。', '、', '」', '』', '）', '！', '？', 'ー', '…']);
const KINSOKU_TAIL_NOT_ALLOWED = new Set(['「', '『', '（']);

const paginateTextFixedViewportAllFeatures = (
  text, 
  charsPerLine, 
  linesPerPage,
  fontSize,
  isSmartAutoFlow = true,
  headingStyle = 'tobira',
  paperHeightPx = 376
) => {
  const physicalMaxChars = Math.max(6, Math.floor(paperHeightPx / Math.max(10, fontSize * 1.15)));
  const targetChars = Math.min(Math.max(6, charsPerLine), physicalMaxChars);
  const targetLines = Math.max(4, linesPerPage);

  const rawParagraphs = text.split('\n');
  const pageBlocks = [];
  let currentLinesOnPage = [];
  let currentBlockStartCharIdx = 0;
  let runningCharCounter = 0;

  const pushPage = () => {
    if (currentLinesOnPage.length > 0) {
      pageBlocks.push({ content: currentLinesOnPage.join('\n') });
      currentLinesOnPage = [];
    }
  };

  rawParagraphs.forEach((p) => {
    const trimmed = p.trim();
    if (!trimmed) {
      if (currentLinesOnPage.length > 0 && currentLinesOnPage[currentLinesOnPage.length - 1] !== '') {
        currentLinesOnPage.push('');
        if (currentLinesOnPage.length >= targetLines) pushPage();
      }
      return;
    }
    
    let paragraphContent = trimmed;
    if (!trimmed.startsWith('「') && !trimmed.startsWith('『') && !trimmed.startsWith('（') && !trimmed.match(/^[0-9A-Za-z]/)) {
      if (!trimmed.startsWith('　') && !trimmed.startsWith(' ')) {
        paragraphContent = `　${trimmed}`;
      }
    }

    const atomicRegex = /(?:\[img:.*?\]|\[注:.*?\]|\[\/?bg(?:-\d+)?\]|\[\/?ul\]|｜[一-龠々ヶa-zA-Z0-9]+《[^》]+》|[一-龠々ヶ]+《[^》]+》|[0-9]{2}(?![0-9])|[a-zA-Z0-9Ａ-Ｚａ-ｚ０-９]|.)/g;
    const rawTokens = paragraphContent.match(atomicRegex) || [paragraphContent];

    let lineBuffer = '';
    let charCount = 0;

    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      let vLen = 1;
      
      lineBuffer += token;
      charCount += vLen;

      if (charCount >= targetChars) {
        currentLinesOnPage.push(lineBuffer);
        lineBuffer = '';
        charCount = 0;
        if (currentLinesOnPage.length >= targetLines) pushPage();
      }
    }

    if (lineBuffer.length > 0) {
      currentLinesOnPage.push(lineBuffer);
      if (currentLinesOnPage.length >= targetLines) pushPage();
    }
  });

  pushPage();
  return pageBlocks;
};

const uploadedTextPath = 'C:\\Users\\n1451\\.gemini\\antigravity\\brain\\fd945ada-c2af-4483-bcc1-750df4bb446f\\.user_uploaded\\media_1786159837903.txt';
let text = fs.readFileSync(uploadedTextPath, 'utf8');

const pages = paginateTextFixedViewportAllFeatures(text, 40, 16, 17, true, 'tobira', 376);
let parsedText = pages.map(p => p.content.replace(/\n/g, '')).join('');

// Find what's missing
let originalNoNewlines = text.replace(/\n/g, '').replace(/\r/g, '');
let parsedNoNewlines = parsedText.replace(/\r/g, '').replace(/　/g, ''); // remove added indents
originalNoNewlines = originalNoNewlines.replace(/　/g, '');

console.log("Original:", originalNoNewlines.substring(originalNoNewlines.length - 100));
console.log("Parsed  :", parsedNoNewlines.substring(parsedNoNewlines.length - 100));

