const fs = require('fs');

const targetFile = 'src/components/ReaderView.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Fix INNER_TEXT_WIDTH calculation (padding is 60px outer + 32px inner = 92px)
const search1 = `  const INNER_TEXT_WIDTH = Math.max(100, containerMaxWidth - 32);`;
const replace1 = `  // 物理パディング計算: 外側(reader-paper-view)が左右30px(計60px) + 内側が左右16px(計32px) = 合計92px
  const TOTAL_HORIZONTAL_PADDING = 92;
  const INNER_TEXT_WIDTH = Math.max(100, containerMaxWidth - TOTAL_HORIZONTAL_PADDING);`;

content = content.replace(search1, replace1);

// Ensure effectiveCharsPerLine and effectiveLinesPerPage are passed to paginateTextFixedViewportAllFeatures
const search2 = `  // 1. レンダリング用の全計算済みページ singlePages を生成（startIndex追跡）
  const singlePages = useMemo(() => {
    return paginateTextFixedViewportAllFeatures(liveEditingText, charsPerLine, linesPerPage, fontSize, isSmartAutoFlow, headingStyle, INNER_TEXT_HEIGHT);
  }, [liveEditingText, charsPerLine, linesPerPage, fontSize, isSmartAutoFlow, headingStyle]);`;
  
const replace2 = `  // 1. レンダリング用の全計算済みページ singlePages を生成（startIndex追跡）
  const singlePages = useMemo(() => {
    return paginateTextFixedViewportAllFeatures(liveEditingText, effectiveCharsPerLine, effectiveLinesPerPage, fontSize, isSmartAutoFlow, headingStyle, INNER_TEXT_HEIGHT);
  }, [liveEditingText, effectiveCharsPerLine, effectiveLinesPerPage, fontSize, isSmartAutoFlow, headingStyle]);`;

content = content.replace(search2, replace2);

fs.writeFileSync(targetFile, content);
console.log('Fixed padding math and effective pagination parameters.');
