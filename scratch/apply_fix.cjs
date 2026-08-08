const fs = require('fs');

const targetFile = 'src/components/ReaderView.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Replace 1: isTwoPageSpread
content = content.replace(
  'const [isTwoPageSpread, setIsTwoPageSpread] = useState(true);',
  'const [isTwoPageSpread, setIsTwoPageSpread] = useState(() => window.innerWidth > 768);'
);

// Replace 2: width limits and effective constraints
const target2 = `  const FIXED_PAPER_HEIGHT = 440;
  const INNER_TEXT_HEIGHT = 376;

  // 物理上限：UIボタンの上限に使用し、表示値もこの範囲内に収める（行間・文字間隔を考慮して 1.15倍で計算）
  const physicalMaxCharsUI = Math.max(6, Math.floor(INNER_TEXT_HEIGHT / Math.max(10, fontSize * 1.15)));
  // 実効文字数（物理上限でクランプされた実際の値）
  const effectiveCharsPerLine = Math.min(charsPerLine, physicalMaxCharsUI);`;

const replacement2 = `  const FIXED_PAPER_HEIGHT = 440;
  const INNER_TEXT_HEIGHT = 376;
  const INNER_TEXT_WIDTH = 448; // 480px width - 32px horizontal padding

  // 物理上限：UIボタンの上限に使用し、表示値もこの範囲内に収める（行間・文字間隔を考慮して 1.15倍で計算）
  const physicalMaxCharsUI = Math.max(6, Math.floor(INNER_TEXT_HEIGHT / Math.max(10, fontSize * 1.15)));
  const physicalMaxLinesUI = Math.max(4, Math.floor(INNER_TEXT_WIDTH / Math.max(10, fontSize * 1.15)));

  // 実効文字数・行数（物理上限でクランプされた実際の値）
  const effectiveCharsPerLine = Math.min(charsPerLine, physicalMaxCharsUI);
  const effectiveLinesPerPage = Math.min(linesPerPage, physicalMaxLinesUI);`;

content = content.replace(target2, replacement2);

// Replace 3: dynamicLineHeight
const target3 = `  // 🎯【文字サイズ調整 100%ダイレクト反映】：fontSizeがそのまま紙面上に大きく・小さく直接適用される
  const dynamicLineHeight = useMemo(() => {
    return Math.max(1.15, Math.min(2.4, INNER_TEXT_HEIGHT / (linesPerPage * fontSize)));
  }, [linesPerPage, fontSize]);`;

const replacement3 = `  // 🎯【文字サイズ調整 100%ダイレクト反映】：fontSizeがそのまま紙面上に大きく・小さく直接適用される
  const dynamicLineHeight = useMemo(() => {
    return Math.max(1.15, Math.min(2.4, INNER_TEXT_WIDTH / (effectiveLinesPerPage * fontSize)));
  }, [effectiveLinesPerPage, fontSize]);`;

content = content.replace(target3, replacement3);

// Replace 4: singlePages memo
const target4 = `  // 1. レンダリング用の全計算済みページ singlePages を生成（startIndex追跡）
  const singlePages = useMemo(() => {
    return paginateTextFixedViewportAllFeatures(liveEditingText, charsPerLine, linesPerPage, fontSize, isSmartAutoFlow, headingStyle, INNER_TEXT_HEIGHT);
  }, [liveEditingText, charsPerLine, linesPerPage, fontSize, isSmartAutoFlow, headingStyle]);`;

const replacement4 = `  // 1. レンダリング用の全計算済みページ singlePages を生成（startIndex追跡）
  const singlePages = useMemo(() => {
    return paginateTextFixedViewportAllFeatures(liveEditingText, effectiveCharsPerLine, effectiveLinesPerPage, fontSize, isSmartAutoFlow, headingStyle, INNER_TEXT_HEIGHT);
  }, [liveEditingText, effectiveCharsPerLine, effectiveLinesPerPage, fontSize, isSmartAutoFlow, headingStyle]);`;

content = content.replace(target4, replacement4);

// Replace 5: linesPerPage UI
const target5 = `            <button
              onClick={() => setTypography(prev => ({ ...prev, linesPerPage: Math.max(5, linesPerPage - 1) }))}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              -
            </button>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#FDE047', minWidth: '24px', textAlign: 'center' }}>
              {linesPerPage}行
            </span>
            <button
              onClick={() => setTypography(prev => ({ ...prev, linesPerPage: Math.min(25, linesPerPage + 1) }))}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              +
            </button>`;

const replacement5 = `            <button
              onClick={() => setTypography(prev => ({ ...prev, linesPerPage: Math.max(5, linesPerPage - 1) }))}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              -
            </button>
            <span 
              title={linesPerPage > physicalMaxLinesUI ? \`幅の物理限界のため、実効表示は \${physicalMaxLinesUI} 行に制限されています\` : ''}
              style={{ fontSize: '12px', fontWeight: '900', color: linesPerPage > physicalMaxLinesUI ? '#F87171' : '#FDE047', minWidth: '32px', textAlign: 'center', cursor: linesPerPage > physicalMaxLinesUI ? 'help' : 'default' }}
            >
              {linesPerPage}{linesPerPage > physicalMaxLinesUI ? \`👉\${physicalMaxLinesUI}\` : ''}行
            </span>
            <button
              onClick={() => {
                if (linesPerPage >= physicalMaxLinesUI) {
                  triggerEditNotice(\`⚠️ これ以上増やすとコンテナ幅（\${INNER_TEXT_WIDTH}px）を物理的に超えるため、実効行数は上がりません\`);
                }
                setTypography(prev => ({ ...prev, linesPerPage: Math.min(40, linesPerPage + 1) }));
              }}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: linesPerPage >= physicalMaxLinesUI ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              +
            </button>`;

content = content.replace(target5, replacement5);

fs.writeFileSync(targetFile, content);
console.log('Fixed ReaderView.tsx');
