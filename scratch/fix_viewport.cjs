const fs = require('fs');

const targetFile = 'src/components/ReaderView.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Replace 1: Add viewportWidth state and resize listener
const search1 = `  const [isTwoPageSpread, setIsTwoPageSpread] = useState(() => window.innerWidth > 768);
  
  const [isLiveEditMode, setIsLiveEditMode] = useState(false);`;

const replace1 = `  const [isTwoPageSpread, setIsTwoPageSpread] = useState(() => window.innerWidth > 768);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const [isLiveEditMode, setIsLiveEditMode] = useState(false);`;

content = content.replace(search1, replace1);

// Replace 2: Calculate INNER_TEXT_WIDTH dynamically
const search2 = `  const FIXED_PAPER_HEIGHT = 440;
  const INNER_TEXT_HEIGHT = 376;
  const INNER_TEXT_WIDTH = 448; // 480px width - 32px horizontal padding

  // 物理上限：UIボタンの上限に使用し、表示値もこの範囲内に収める（行間・文字間隔を考慮して 1.15倍で計算）
  const physicalMaxCharsUI = Math.max(6, Math.floor(INNER_TEXT_HEIGHT / Math.max(10, fontSize * 1.15)));
  const physicalMaxLinesUI = Math.max(4, Math.floor(INNER_TEXT_WIDTH / Math.max(10, fontSize * 1.15)));`;

const replace2 = `  const FIXED_PAPER_HEIGHT = 440;
  const INNER_TEXT_HEIGHT = 376;
  
  // コンテナの最大幅に基づく実効幅の動的計算（パディング左右計32px分を引く）
  // 90% width なので viewportWidth * 0.9 と 480px の小さい方
  const singleMaxWidth = Math.min(viewportWidth * 0.9, 480);
  const spreadMaxWidth = Math.min(viewportWidth * 0.9, 920) / 2;
  const containerMaxWidth = isTwoPageSpread ? spreadMaxWidth : singleMaxWidth;
  const INNER_TEXT_WIDTH = Math.max(100, containerMaxWidth - 32);

  // 物理上限：UIボタンの上限に使用し、表示値もこの範囲内に収める（行間・文字間隔を考慮して 1.15倍で計算）
  const physicalMaxCharsUI = Math.max(6, Math.floor(INNER_TEXT_HEIGHT / Math.max(10, fontSize * 1.15)));
  const physicalMaxLinesUI = Math.max(4, Math.floor(INNER_TEXT_WIDTH / Math.max(10, fontSize * 1.15)));`;

content = content.replace(search2, replace2);

// Replace 3: Update triggerEditNotice strings
const search3 = `title={linesPerPage > physicalMaxLinesUI ? \`幅の物理限界のため、実効表示は \${physicalMaxLinesUI} 行に制限されています\` : ''}`;
const replace3 = `title={linesPerPage > physicalMaxLinesUI ? \`幅の物理限界(\${Math.floor(INNER_TEXT_WIDTH)}px)のため、実効表示は \${physicalMaxLinesUI} 行に制限されています\` : ''}`;
content = content.replace(search3, replace3);

const search4 = `triggerEditNotice(\`⚠️ これ以上増やすとコンテナ幅（\${INNER_TEXT_WIDTH}px）を物理的に超えるため、実効行数は上がりません\`);`;
const replace4 = `triggerEditNotice(\`⚠️ これ以上増やすとコンテナ幅（\${Math.floor(INNER_TEXT_WIDTH)}px）を物理的に超えるため、実効行数は上がりません\`);`;
content = content.replace(search4, replace4);

fs.writeFileSync(targetFile, content);
console.log('Fixed viewport width logic in ReaderView.tsx');
