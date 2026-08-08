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
  if (!text || text.trim().length === 0) return [{ content: '（本文が空です）', startIndex: 0 }];

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
      if (isSmartAutoFlow && currentLinesOnPage.length > 1) {
        const lastLine = currentLinesOnPage[currentLinesOnPage.length - 1];
        if (lastLine === '「' || lastLine === '『' || lastLine === '（') {
          currentLinesOnPage.pop();
          pageBlocks.push({ content: currentLinesOnPage.join('\n'), isTobira: false, startIndex: currentBlockStartCharIdx });
          currentLinesOnPage = [lastLine];
          currentBlockStartCharIdx = runningCharCounter - lastLine.length;
          return;
        }
      }

      pageBlocks.push({ content: currentLinesOnPage.join('\n'), isTobira: false, startIndex: currentBlockStartCharIdx });
      currentLinesOnPage = [];
      currentBlockStartCharIdx = runningCharCounter;
    }
  };

  rawParagraphs.forEach((p) => {
    const trimmed = p.trim();
    if (!trimmed) {
      if (currentLinesOnPage.length > 0 && currentLinesOnPage[currentLinesOnPage.length - 1] !== '') {
        currentLinesOnPage.push('');
        if (currentLinesOnPage.length >= targetLines) {
          pushPage();
        }
      }
      runningCharCounter += p.length + 1;
      return;
    }

    const isMajorHeading = trimmed.startsWith('# ') || trimmed.startsWith('【章') || trimmed.match(/^(第[一二三四五六七八九十0-9]+章)/) || trimmed.startsWith('プロローグ') || trimmed.startsWith('エピローグ');
    const isMinorHeading = trimmed.startsWith('## ') || trimmed.startsWith('■ ') || trimmed.match(/^(第[一二三四五六七八九十0-9]+節)/);

    if (isMajorHeading) {
      pushPage();
      currentBlockStartCharIdx = runningCharCounter;
      if (headingStyle === 'tobira') {
        pageBlocks.push({ content: trimmed.replace(/^#\s*/, ''), isTobira: true, startIndex: runningCharCounter });
        runningCharCounter += p.length + 1;
        currentBlockStartCharIdx = runningCharCounter;
        return;
      }
    }

    let paragraphContent = trimmed;
    if (!isMajorHeading && !isMinorHeading && !trimmed.startsWith('「') && !trimmed.startsWith('『') && !trimmed.startsWith('（') && !trimmed.startsWith('(') && !trimmed.match(/^[0-9A-Za-z]/)) {
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

      let nextRealToken = '';
      for (let j = i + 1; j < rawTokens.length; j++) {
        const candidate = rawTokens[j];
        if (!candidate.startsWith('[bg') && !candidate.startsWith('[/bg') && !candidate.startsWith('[ul') && !candidate.startsWith('[/ul') && !candidate.startsWith('[注:')) {
          nextRealToken = candidate;
          break;
        }
      }

      let vLen = 1;
      if (token.startsWith('[bg') || token.startsWith('[/bg') || token.startsWith('[ul') || token.startsWith('[/ul') || token.startsWith('[注:')) {
        vLen = 0;
      } else if (token.startsWith('[img:')) {
        vLen = 0;
      } else if (token.includes('《')) {
        vLen = token.replace(/.*(?:｜|)([一-龠々ヶa-zA-Z0-9]+)《.*/, '$1').length;
      } else if (/^[0-9]{2}$/.test(token)) {
        vLen = 1;
      } else if (/^[a-zA-Z0-9Ａ-Ｚａ-ｚ０-９]$/.test(token)) {
        vLen = 1;
      }

      if (vLen > 0 && KINSOKU_TAIL_NOT_ALLOWED.has(token) && charCount + vLen >= targetChars) {
        if (lineBuffer.length > 0) {
          currentLinesOnPage.push(lineBuffer);
          lineBuffer = '';
          charCount = 0;
          if (currentLinesOnPage.length >= targetLines) {
            pushPage();
          }
        }
        lineBuffer += token;
        charCount += vLen;
        continue;
      }

      if (vLen > 0 && KINSOKU_HEAD_NOT_ALLOWED.has(nextRealToken) && charCount + vLen >= targetChars) {
        lineBuffer += token;
        for (let j = i + 1; j < rawTokens.length; j++) {
          const t = rawTokens[j];
          lineBuffer += t;
          i = j;
          const isTag = t.startsWith('[bg') || t.startsWith('[/bg') || t.startsWith('[ul') || t.startsWith('[/ul') || t.startsWith('[注:');
          if (!isTag && KINSOKU_HEAD_NOT_ALLOWED.has(t)) {
            break;
          }
        }
        currentLinesOnPage.push(lineBuffer);
        lineBuffer = '';
        charCount = 0;
        if (currentLinesOnPage.length >= targetLines) {
          pushPage();
        }
        continue;
      }

      if (vLen > 0 && charCount + vLen > targetChars && lineBuffer.length > 0) {
        currentLinesOnPage.push(lineBuffer);
        lineBuffer = '';
        charCount = 0;
        if (currentLinesOnPage.length >= targetLines) {
          pushPage();
        }
      }

      if (vLen > 0 && charCount === 0 && KINSOKU_HEAD_NOT_ALLOWED.has(token)) {
        if (currentLinesOnPage.length > 0) {
          currentLinesOnPage[currentLinesOnPage.length - 1] += token;
        } else if (pageBlocks.length > 0) {
          const prevLines = pageBlocks[pageBlocks.length - 1].content.split('\n');
          prevLines[prevLines.length - 1] += token;
          pageBlocks[pageBlocks.length - 1].content = prevLines.join('\n');
        } else {
          lineBuffer += token;
          charCount += vLen;
        }
        continue;
      }

      lineBuffer += token;
      charCount += vLen;
    }

    if (lineBuffer.length > 0) {
      currentLinesOnPage.push(lineBuffer);
      if (currentLinesOnPage.length >= targetLines) {
        pushPage();
      }
    }

    runningCharCounter += p.length + 1;
  });

  pushPage();

  for (let bi = 0; bi < pageBlocks.length; bi++) {
    const lines = pageBlocks[bi].content.split('\n');
    for (let li = 0; li < lines.length; li++) {
      while (lines[li].length > 0 && KINSOKU_HEAD_NOT_ALLOWED.has(lines[li][0])) {
        const ch = lines[li][0];
        lines[li] = lines[li].substring(1);
        if (li > 0) {
          lines[li - 1] += ch;
        } else if (bi > 0) {
          const prevLines = pageBlocks[bi - 1].content.split('\n');
          prevLines[prevLines.length - 1] += ch;
          pageBlocks[bi - 1].content = prevLines.join('\n');
        }
      }
    }
    pageBlocks[bi].content = lines.join('\n');
  }

  return pageBlocks.map(b => {
    return { content: b.content, isTobira: b.isTobira, startIndex: b.startIndex };
  });
};

const uploadedTextPath = 'C:\\Users\\n1451\\.gemini\\antigravity\\brain\\fd945ada-c2af-4483-bcc1-750df4bb446f\\.user_uploaded\\media_1786159837903.txt';
let text = fs.readFileSync(uploadedTextPath, 'utf8');

console.log("Original text length:", text.length);

const pagesSmall = paginateTextFixedViewportAllFeatures(text, 40, 16, 17, true, 'tobira', 376);
let parsedLengthSmall = pagesSmall.map(p => p.content.replace(/\n/g, '')).join('').length;
console.log(`Small config: pages = ${pagesSmall.length}, text in pages = ${parsedLengthSmall}`);

// Test with bigger font size
const pagesLarge = paginateTextFixedViewportAllFeatures(text, 40, 16, 25, true, 'tobira', 376);
let parsedLengthLarge = pagesLarge.map(p => p.content.replace(/\n/g, '')).join('').length;
console.log(`Large config: pages = ${pagesLarge.length}, text in pages = ${parsedLengthLarge}`);

// Let's see how much of the text actually made it to the end
console.log("Last page snippet small config:", pagesSmall[pagesSmall.length-1].content.substring(0, 50));
console.log("Last page snippet large config:", pagesLarge[pagesLarge.length-1].content.substring(0, 50));
