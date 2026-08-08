const fs = require('fs');

const KINSOKU_HEAD_NOT_ALLOWED = new Set(['。', '、', '」', '』', '）', '！', '？', 'ー', '…', '』', '】', '］', '〕', '〉', '》', '」', '’', '”', '，', '．', '：', '；', 'ヽ', 'ヾ', 'ー', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'っ', 'ゃ', 'ゅ', 'ょ', 'ゎ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ッ', 'ャ', 'ュ', 'ョ', 'ヮ', 'ヵ', 'ヶ']);
const KINSOKU_TAIL_NOT_ALLOWED = new Set(['「', '『', '（', '【', '［', '〔', '〈', '《', '「', '‘', '“']);

function simulateJSXRender(text) {
  const start = performance.now();
  const rawParagraphs = text.split('\n');
  let nodeCount = 0;

  rawParagraphs.forEach((p, pIdx) => {
    const trimmed = p.trim();
    if (!trimmed) {
      nodeCount++;
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

    rawTokens.forEach((token, i) => {
      if (token.startsWith('[img:')) {
        nodeCount++;
      } else if (token.includes('《')) {
        nodeCount += 3; // ruby, rt, rp
      } else if (token.startsWith('[注:')) {
        nodeCount++;
      } else if (token.match(/^[0-9]{2}$/)) {
        nodeCount++; // tcy
      } else if (token.match(/^[a-zA-Z0-9Ａ-Ｚａ-ｚ０-９]$/)) {
        nodeCount++; // upright
      } else {
        nodeCount++; // normal text node
      }
    });
  });

  const end = performance.now();
  console.log(`Simulated render of 90k chars: ${nodeCount} nodes created in ${end - start} ms`);
}

const text = fs.readFileSync('C:\\Users\\n1451\\.gemini\\antigravity\\brain\\fd945ada-c2af-4483-bcc1-750df4bb446f\\.user_uploaded\\media_1786159837903.txt', 'utf8');
simulateJSXRender(text);
