import React, { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { TypographySettings, CoverSettings, BookType, ComicPage, TocItem, FontTheme, PaperTheme } from '../types';
import { exportBookToEpub } from '../utils/epubExporter';
import { 
  Settings, 
  ArrowLeft,
  Sparkles,
  ListTree,
  X,
  Edit3,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Maximize2,
  Minimize2,
  Undo2,
  BookOpenCheck,
  FileText,
  Heading1,
  Heading2,
  Type,
  Wand2,
  Highlighter,
  Underline as UnderlineIcon,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Target,
  Download,
  Printer,
  HelpCircle,
  Image as ImageIcon,
  BookOpen,
  PlusCircle,
  BookmarkPlus,
  MousePointer,
  ListOrdered,
  Trash2,
  GripVertical,
  Bookmark,
  Sliders,
  Share2
} from 'lucide-react';
import LZString from 'lz-string';

interface ReaderViewProps {
  typography: TypographySettings;
  setTypography: React.Dispatch<React.SetStateAction<TypographySettings>>;
  cover: CoverSettings;
  bookTitle: string;
  authorName: string;
  rawText: string;
  setRawText?: (text: string) => void;
  bookType: BookType;
  comicPages: ComicPage[];
  tocItems?: TocItem[];
  onBackToStudio: () => void;
  isSharedMode?: boolean;
}

// 📖【JIS X 4051 準拠・商業出版レベル禁則文字セット】
// 行頭禁則：行の先頭に置いてはいけない文字（前行末に収める）
const KINSOKU_HEAD_NOT_ALLOWED = new Set([
  // 句読点
  '、', '。', '，', '．',
  // 閉じ括弧・閉じ記号
  '」', '』', '）', ')', ']', '}', '〕', '〗', '〉', '》', '›', '»', '｝', '｣',
  // 感嘆・疑問
  '！', '？', '!', '?',
  // 長音・波線・リーダー
  'ー', '〜', '～', '…', '‥',
  // 小書き仮名
  'っ', 'ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ',
  'ッ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ',
  // 中黒・コロン等
  '・', '：', '；', ':', ';',
  // 繰り返し記号
  'ヽ', 'ヾ', 'ゝ', 'ゞ', '々', '〻',
]);
// 行末禁則：行の末尾に置いてはいけない文字（次行先頭に送る）
const KINSOKU_TAIL_NOT_ALLOWED = new Set([
  '「', '『', '（', '(', '[', '{', '〔', '〖', '〈', '《', '‹', '«', '｛', '｢',
]);

// 🚀【複数行・改行またぎ完全対応：開くタグ/閉じるタグの行跨ぎ補正トランスフォーマー】
const normalizeMultilineTags = (text: string): string => {
  if (!text) return '';

  const bgMultilineRegex = /\[bg(?:-(10|20|35|100))?\]([\s\S]*?)\[\/bg(?:-(?:10|20|35|100))?\]/g;
  let normalized = text.replace(bgMultilineRegex, (_match, tone, content) => {
    const activeTone = tone || '20';
    const lines = content.split('\n');
    return lines.map((line: string) => {
      if (line.trim().length === 0) return '';
      return `[bg-${activeTone}]${line}[/bg-${activeTone}]`;
    }).join('\n');
  });

  const ulMultilineRegex = /\[ul\]([\s\S]*?)\[\/ul\]/g;
  normalized = normalized.replace(ulMultilineRegex, (_match, content) => {
    const lines = content.split('\n');
    return lines.map((line: string) => {
      if (line.trim().length === 0) return '';
      return `[ul]${line}[/ul]`;
    }).join('\n');
  });

  return normalized;
};

// 🚀【全4大機能完全搭載：ルビ ＆ スミ濃淡 ＆ 下線 ＆ 脚注[注:説明] ＆ 挿絵[img:URL] ＆ 縦中横全自動 JSX レンダラー】
const renderPureJSXWithAllFeatures = (
  text: string, 
  onFootnoteClick: (title: string, note: string) => void
): React.ReactNode => {
  if (!text) return null;

  const normalizedText = normalizeMultilineTags(text);

  let cleanText = normalizedText
    .replace(/<ruby>(?:<rb>)?([^<]+)(?:<\/rb>)?<rt>([^<]+)<\/rt><\/ruby>/gi, '｜$1《$2》')
    .replace(/<ruby>([^<]+)<rt>([^<]+)<\/rt><\/ruby>/gi, '｜$1《$2》')
    .replace(/<rt>([^<]+)<\/rt>/gi, '《$1》')
    .replace(/<\/?ruby>/gi, '');

  const imgRegex = /\[img:(.*?)\]/g;
  if (imgRegex.test(cleanText)) {
    const parts = cleanText.split(/\[img:(.*?)\]/);
    return (
      <>
        {parts.map((part, idx) => {
          if (idx % 2 === 1) {
            return (
              <img
                key={`img-${idx}`}
                src={part}
                alt="挿絵イラスト"
                className="embedded-illustration"
              />
            );
          }
          return <React.Fragment key={`txt-${idx}`}>{renderPureJSXWithAllFeatures(part, onFootnoteClick)}</React.Fragment>;
        })}
      </>
    );
  }

  const noteRegex = /\[注:(.*?)\]/g;
  const noteSegments: { type: 'note' | 'plain'; noteText?: string; content: string }[] = [];
  let nLastIdx = 0;
  let nMatch: RegExpExecArray | null;

  while ((nMatch = noteRegex.exec(cleanText)) !== null) {
    if (nMatch.index > nLastIdx) {
      noteSegments.push({ type: 'plain', content: cleanText.substring(nLastIdx, nMatch.index) });
    }
    noteSegments.push({ type: 'note', noteText: nMatch[1], content: '' });
    nLastIdx = noteRegex.lastIndex;
  }
  if (nLastIdx < cleanText.length) {
    noteSegments.push({ type: 'plain', content: cleanText.substring(nLastIdx) });
  }

  const styleRegex = /(?:\[bg(?:-(10|20|35|100))?\]([\s\S]*?)\[\/bg(?:-(?:10|20|35|100))?\]|\[ul\]([\s\S]*?)\[\/ul\])/g;

  const renderPlainWithStyles = (str: string, pKey: string) => {
    const mainSegments: { type: 'mesh' | 'underline' | 'plain'; tone?: string; content: string }[] = [];
    let sLastIdx = 0;
    let sMatch: RegExpExecArray | null;

    while ((sMatch = styleRegex.exec(str)) !== null) {
      if (sMatch.index > sLastIdx) {
        mainSegments.push({ type: 'plain', content: str.substring(sLastIdx, sMatch.index) });
      }
      if (sMatch[1] !== undefined) {
        mainSegments.push({ type: 'mesh', tone: sMatch[1], content: sMatch[2] });
      } else if (sMatch[2] !== undefined && sMatch[3] === undefined) {
        mainSegments.push({ type: 'mesh', tone: '20', content: sMatch[2] });
      } else if (sMatch[3] !== undefined) {
        mainSegments.push({ type: 'underline', content: sMatch[3] });
      }
      sLastIdx = styleRegex.lastIndex;
    }
    if (sLastIdx < str.length) {
      mainSegments.push({ type: 'plain', content: str.substring(sLastIdx) });
    }

    const renderSegmentContent = (sStr: string, segmentKey: string) => {
      const rubyRegex = /(?:｜([一-龠々ヶa-zA-Z0-9]+)《([^》]+)》|([一-龠々ヶ]+)《([^》]+)》)/g;
      const segments: { type: 'ruby' | 'text'; kanji?: string; furigana?: string; content?: string }[] = [];
      let lastIdx = 0;
      let match: RegExpExecArray | null;

      while ((match = rubyRegex.exec(sStr)) !== null) {
        if (match.index > lastIdx) {
          segments.push({ type: 'text', content: sStr.substring(lastIdx, match.index) });
        }
        segments.push({
          type: 'ruby',
          kanji: match[1] || match[3],
          furigana: match[2] || match[4]
        });
        lastIdx = rubyRegex.lastIndex;
      }
      if (lastIdx < sStr.length) {
        segments.push({ type: 'text', content: sStr.substring(lastIdx) });
      }

      const renderWithAlphanumeric = (aStr: string, prefix: string) => {
        // 🔤 英数・全角英数・キリル文字・アンパサンド(M&A, М＆A等)を完璧に補獲する正規表現
        const alphaRegex = /([a-zA-Z0-9Ａ-Ｚａ-ｚА-я0-9０-９]+|&|＆)/g;
        const parts: React.ReactNode[] = [];
        let pLastIdx = 0;
        let aMatch: RegExpExecArray | null;

        while ((aMatch = alphaRegex.exec(aStr)) !== null) {
          if (aMatch.index > pLastIdx) {
            parts.push(aStr.substring(pLastIdx, aMatch.index));
          }
          const token = aMatch[1];
          if (token === '&' || token === '＆') {
            parts.push(
              <span key={`${prefix}-amp-${aMatch.index}`} className="ampersand-text">
                ＆
              </span>
            );
          } else if (/[a-zA-ZＡ-Ｚａ-ｚА-я]/.test(token)) {
            // 全角・半角アルファベットおよびキリル文字(М, A等)は100%直立表示
            parts.push(
              <span key={`${prefix}-upr-${aMatch.index}`} className="upright-text">
                {token}
              </span>
            );
          } else if (token.length <= 2) {
            // 🔢 2桁までの数字（0〜99）は縦中横
            parts.push(
              <span key={`${prefix}-tcy-${aMatch.index}`} className="tate-chu-yoko">
                {token}
              </span>
            );
          } else {
            // 🔢 3桁以上の数字（100, 10000等）は和文書籍標準の全角数字(１００)として美しく縦流し表示
            const fullWidthNum = token.replace(/[0-9]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0));
            parts.push(
              <React.Fragment key={`${prefix}-numfw-${aMatch.index}`}>
                {fullWidthNum}
              </React.Fragment>
            );
          }
          pLastIdx = alphaRegex.lastIndex;
        }

        if (pLastIdx < aStr.length) {
          parts.push(aStr.substring(pLastIdx));
        }

        return parts;
      };

      return (
        <>
          {segments.map((seg, i) => {
            if (seg.type === 'ruby') {
              return (
                <ruby key={`${segmentKey}-r-${i}`}>
                  {renderWithAlphanumeric(seg.kanji || '', `${segmentKey}-rk-${i}`)}
                  <rt>{seg.furigana}</rt>
                </ruby>
              );
            } else {
              return <React.Fragment key={`${segmentKey}-t-${i}`}>{renderWithAlphanumeric(seg.content || '', `${segmentKey}-tx-${i}`)}</React.Fragment>;
            }
          })}
        </>
      );
    };

    return (
      <>
        {mainSegments.map((mSeg, idx) => {
          if (mSeg.type === 'mesh') {
            const toneClass = mSeg.tone ? `mesh-highlight-${mSeg.tone}` : 'mesh-highlight-20';
            return (
              <span key={`${pKey}-m-${idx}`} className={toneClass}>
                {renderSegmentContent(mSeg.content, `${pKey}-m-${idx}`)}
              </span>
            );
          } else if (mSeg.type === 'underline') {
            return (
              <span key={`${pKey}-u-${idx}`} className="custom-underline">
                {renderSegmentContent(mSeg.content, `${pKey}-u-${idx}`)}
              </span>
            );
          } else {
            return <React.Fragment key={`${pKey}-p-${idx}`}>{renderSegmentContent(mSeg.content, `${pKey}-p-${idx}`)}</React.Fragment>;
          }
        })}
      </>
    );
  };

  let noteCounter = 1;

  return (
    <>
      {noteSegments.map((nSeg, nIdx) => {
        if (nSeg.type === 'note') {
          const currentCount = noteCounter++;
          const noteText = nSeg.noteText || '';
          return (
            <span
              key={`note-${nIdx}`}
              className="footnote-badge"
              onClick={() => onFootnoteClick(`注釈 [${currentCount}]`, noteText)}
              title={`クリックで注釈表示: ${noteText}`}
            >
              注{currentCount}
            </span>
          );
        } else {
          return <React.Fragment key={`ns-${nIdx}`}>{renderPlainWithStyles(nSeg.content, `ns-${nIdx}`)}</React.Fragment>;
        }
      })}
    </>
  );
};

// 🎯【100%全文字欠損・のど隠れ・オーバーフロー防止 商業出版標準ページ分割エンジン】
const paginateTextFixedViewportAllFeatures = (
  text: string, 
  charsPerLine: number, 
  linesPerPage: number,
  fontSize: number,
  isSmartAutoFlow: boolean = true,
  headingStyle: 'inline' | 'tobira' = 'tobira',
  paperHeightPx: number = 376
): { content: string; isTobira?: boolean; startIndex: number }[] => {
  if (!text || text.trim().length === 0) return [{ content: '（本文が空です）', startIndex: 0 }];

  // 🛡️ 物理上限計算：ページ有効高さ ÷ フォントサイズ（1.15倍マージン）
  const physicalMaxChars = Math.max(6, Math.floor(paperHeightPx / Math.max(10, fontSize * 1.15)));
  const targetChars = Math.min(Math.max(6, charsPerLine), physicalMaxChars);
  const targetLines = Math.max(4, linesPerPage);

  const rawParagraphs = text.split('\n');
  const pageBlocks: { content: string; isTobira?: boolean; startIndex: number }[] = [];
  let currentLinesOnPage: string[] = [];
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

    // 🔤 英数字は1文字単位でトークン化（縦書きで各文字が1マス占有するため正確なカウントに必要）
    // ただし2桁の半角数字は縦中横で1マスにまとまるので「NN」として1トークンにする
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
        // 2桁数字は縦中横で1マスに収まる → vLen=1
        vLen = 1;
      } else if (/^[a-zA-Z0-9Ａ-Ｚａ-ｚ０-９]$/.test(token)) {
        // 英字・全角英数・1桁数字は縦書きで1マス
        vLen = 1;
      }

      // 【行末禁則】行末禁則文字（開き括弧等）が行末ギリギリに来たら次行の先頭へ送る
      if (vLen > 0 && KINSOKU_TAIL_NOT_ALLOWED.has(token) && charCount + vLen >= targetChars) {
        if (lineBuffer.length > 0) {
          currentLinesOnPage.push(lineBuffer);
          lineBuffer = '';
          charCount = 0;
          if (currentLinesOnPage.length >= targetLines) {
            pushPage();
          }
        }
        // このトークン（開き括弧）は次行の先頭として lineBuffer に積む
        lineBuffer += token;
        charCount += vLen;
        continue;
      }

      // 【行頭禁則】次トークンが行頭禁則文字で、現行がちょうど埋まりそうなら現行を1文字延ばして吸収
      if (vLen > 0 && KINSOKU_HEAD_NOT_ALLOWED.has(nextRealToken) && charCount + vLen >= targetChars) {
        lineBuffer += token;
        // 行頭禁則文字（および直前のタグ類）を現行末に連結する
        for (let j = i + 1; j < rawTokens.length; j++) {
          const t = rawTokens[j];
          lineBuffer += t;
          i = j;
          // タグ類はスキップしながら、禁則文字本体が来たら止まる
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

      // 通常の行折り返し
      if (vLen > 0 && charCount + vLen > targetChars && lineBuffer.length > 0) {
        currentLinesOnPage.push(lineBuffer);
        lineBuffer = '';
        charCount = 0;

        if (currentLinesOnPage.length >= targetLines) {
          pushPage();
        }
      }

      // 🔴【行頭禁則・確実補完】折り返し後の行頭（charCount===0）に禁則文字が来た場合、
      // 必ず前行末に吸収する。currentLinesOnPage が空（pushPage直後）の場合は pageBlocks の末尾を参照。
      if (vLen > 0 && charCount === 0 && KINSOKU_HEAD_NOT_ALLOWED.has(token)) {
        if (currentLinesOnPage.length > 0) {
          currentLinesOnPage[currentLinesOnPage.length - 1] += token;
        } else if (pageBlocks.length > 0) {
          // ページ境界を越えた場合は前ページの最終行に追記
          const prevLines = pageBlocks[pageBlocks.length - 1].content.split('\n');
          prevLines[prevLines.length - 1] += token;
          pageBlocks[pageBlocks.length - 1].content = prevLines.join('\n');
        } else {
          // 段落の絶対先頭（回避不能）
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

  // 🔴【後処理：行頭禁則の最終保証パス】
  // ページ生成エンジンの先読み方式では捉えきれなかった行頭禁則を全消しする
  for (let bi = 0; bi < pageBlocks.length; bi++) {
    const lines = pageBlocks[bi].content.split('\n');
    for (let li = 0; li < lines.length; li++) {
      // 行頭の文字を複数連続チェック（例: 「。」「、」が2連続で来た場合も対処）
      while (lines[li].length > 0 && KINSOKU_HEAD_NOT_ALLOWED.has(lines[li][0])) {
        const ch = lines[li][0];
        lines[li] = lines[li].substring(1);
        if (li > 0) {
          // 同ページの前行末に追加
          lines[li - 1] += ch;
        } else if (bi > 0) {
          // 前ページの最終行末に追加
          const prevLines = pageBlocks[bi - 1].content.split('\n');
          prevLines[prevLines.length - 1] += ch;
          pageBlocks[bi - 1].content = prevLines.join('\n');
        }
        // bi===0 && li===0（絶対先頭）は行頭に置かざるを得ない
      }
    }
    pageBlocks[bi].content = lines.join('\n');
  }

  // 🎯 ページ境界での勝手な行削除(lines.shift())を全廃し、文章の連続結合を100%完全保護
  return pageBlocks.map(b => {
    return { content: b.content, isTobira: b.isTobira, startIndex: b.startIndex };
  });
};

export const ReaderView: React.FC<ReaderViewProps> = ({
  typography,
  setTypography,
  bookTitle,
  authorName,
  rawText,
  setRawText,
  bookType,
  comicPages,
  tocItems = [],
  onBackToStudio,
  isSharedMode = false
}) => {
  // 🔖【読書位置の自動復元】
  const storageKey = useMemo(() => `ebook_last_read_page_${bookTitle || 'default'}`, [bookTitle]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(() => {
    if (isSharedMode) return 0; // 共有モード時は常に1ページ目から
    try {
      const savedPage = localStorage.getItem(storageKey);
      if (savedPage !== null) {
        const parsed = parseInt(savedPage, 10);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
      }
    } catch (e) {
      console.error('Failed to load last read page', e);
    }
    return 0;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showTocSidebar, setShowTocSidebar] = useState(false);

  const [isSmartAutoFlow, setIsSmartAutoFlow] = useState(true);
  const [isHalfWidthPacking, setIsHalfWidthPacking] = useState(true);
  const [isTwoPageSpread, setIsTwoPageSpread] = useState(true);
  
  const [isLiveEditMode, setIsLiveEditMode] = useState(false);
  const [liveEditingText, setLiveEditingText] = useState(rawText);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const [editNotice, setEditNotice] = useState<string | null>(null);
  const [shareLinkLoading, setShareLinkLoading] = useState(false);

  const [pageDirection, setPageDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [selectedTone, setSelectedTone] = useState<'10' | '20' | '35' | '100'>('20');
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const [activeFootnote, setActiveFootnote] = useState<{ title: string; note: string } | null>(null);

  // 🚀 文字・文章選択時ツールバー
  const [pageSelection, setPageSelection] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const paperContainerRef = useRef<HTMLDivElement>(null);
  const toolbarMenuRef = useRef<HTMLDivElement>(null);
  const liveTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fontSize = typography.fontSize || 16;
  const charsPerLine = typography.charsPerLine || 20;
  const linesPerPage = typography.linesPerPage || 12;
  const headingStyle = typography.headingStyle || 'tobira';

  const FIXED_PAPER_HEIGHT = 440;
  const INNER_TEXT_HEIGHT = 376;

  // 物理上限：UIボタンの上限に使用し、表示値もこの範囲内に収める（行間・文字間隔を考慮して 1.15倍で計算）
  const physicalMaxCharsUI = Math.max(6, Math.floor(INNER_TEXT_HEIGHT / Math.max(10, fontSize * 1.15)));
  // 実効文字数（物理上限でクランプされた実際の値）
  const effectiveCharsPerLine = Math.min(charsPerLine, physicalMaxCharsUI);

  const paperTheme: PaperTheme = typography.paperTheme || 'bunkobon';
  const fontTheme: FontTheme = typography.fontTheme || 'shippori';

  const themeStyles = useMemo(() => {
    let bg = '#FDF6E3';
    let textClr = '#2D2013';

    if (paperTheme === 'bunkobon') {
      bg = '#FBF0D9';
      textClr = '#2A2421';
    } else if (paperTheme === 'sepia') {
      bg = '#F5E6C8';
      textClr = '#3B2E1E';
    } else if (paperTheme === 'dark') {
      bg = '#0F172A';
      textClr = '#F8FAFC';
    } else if (paperTheme === 'white') {
      bg = '#FFFFFF';
      textClr = '#0F172A';
    }

    let fontFamily = "'Shippori Mincho', serif";
    if (fontTheme === 'shippori') fontFamily = "'Shippori Mincho', serif";
    else if (fontTheme === 'serif') fontFamily = "'Noto Serif JP', serif";
    else if (fontTheme === 'sans') fontFamily = "'Noto Sans JP', sans-serif";
    else if (fontTheme === 'zen') fontFamily = "'Zen Kaku Gothic New', sans-serif";

    return { bg, textClr, fontFamily };
  }, [paperTheme, fontTheme]);

  // 🎯【文字サイズ調整 100%ダイレクト反映】：fontSizeがそのまま紙面上に大きく・小さく直接適用される
  const dynamicLineHeight = useMemo(() => {
    return Math.max(1.15, Math.min(2.4, INNER_TEXT_HEIGHT / (linesPerPage * fontSize)));
  }, [linesPerPage, fontSize]);

  useEffect(() => {
    setLiveEditingText(rawText);
  }, [rawText]);

  // 1. レンダリング用の全計算済みページ singlePages を生成（startIndex追跡）
  const singlePages = useMemo(() => {
    return paginateTextFixedViewportAllFeatures(liveEditingText, charsPerLine, linesPerPage, fontSize, isSmartAutoFlow, headingStyle, INNER_TEXT_HEIGHT);
  }, [liveEditingText, charsPerLine, linesPerPage, fontSize, isSmartAutoFlow, headingStyle]);

  // 🧹【純粋本文のみ抽出】：ダミーを完全排除したリアル本文連動目次エンジン
  const computedTocItems = useMemo(() => {
    const items: TocItem[] = [];
    const lines = liveEditingText.split('\n');
    let lineCounter = 1;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      const cleanTitle = trimmed
        .replace(/^#\s*|^##\s*|^■\s*/, '')
        .replace(/\[\/?bg(?:-\d+)?\]/g, '')
        .replace(/\[\/?ul\]/g, '')
        .replace(/\[注:.*?\]/g, '')
        .replace(/｜|《[^》]+》/g, '')
        .trim();

      if (!cleanTitle || cleanTitle === '無題の章' || cleanTitle === '無題の小見出し') {
        lineCounter++;
        return;
      }

      if (trimmed.startsWith('# ') || trimmed.startsWith('【章') || trimmed.match(/^(第[一二三四五六七八九十0-9]+章)/)) {
        items.push({
          id: `toc-${idx}`,
          title: cleanTitle,
          level: 1,
          pageNumber: Math.max(1, Math.ceil(lineCounter / (linesPerPage || 12)))
        });
      } else if (trimmed.startsWith('■ ') || trimmed.startsWith('## ') || trimmed.match(/^(第[一二三四五六七八九十0-9]+節)/)) {
        items.push({
          id: `toc-${idx}`,
          title: cleanTitle,
          level: 2,
          pageNumber: Math.max(1, Math.ceil(lineCounter / (linesPerPage || 12)))
        });
      }
      lineCounter++;
    });

    return items;
  }, [liveEditingText, linesPerPage]);

  const totalSinglePages = bookType === 'comic' ? comicPages.length : Math.max(1, singlePages.length);

  const spreadPages = useMemo(() => {
    const pages: { first: { content: string; isTobira?: boolean; startIndex: number }; second: { content: string; isTobira?: boolean; startIndex: number } }[] = [];
    if (bookType !== 'comic') {
      for (let i = 0; i < singlePages.length; i += 2) {
        const p1 = singlePages[i] || { content: '', isTobira: false, startIndex: 0 };
        const p2 = singlePages[i + 1] || { content: '', isTobira: false, startIndex: 0 };
        pages.push({ first: p1, second: p2 });
      }
    }
    return pages;
  }, [singlePages, bookType]);

  const maxIndex = isTwoPageSpread ? Math.max(0, spreadPages.length - 1) : Math.max(0, totalSinglePages - 1);

  // 📊【現在文字位置・総文字数の計算】
  const totalCharCount = useMemo(() => {
    // タグや記号を除いた実質的な文章文字数
    return liveEditingText.replace(/\[.*?\]/g, '').replace(/\s/g, '').length;
  }, [liveEditingText, isSharedMode]);

  // 🔗 共有URL作成ロジック
  const handleCreateShareLink = async () => {
    if (isSharedMode) return;
    setShareLinkLoading(true);
    try {
      const shareData = {
        title: bookTitle,
        author: authorName,
        text: liveEditingText,
        typography,
        type: bookType,
        comic: comicPages
      };
      const jsonStr = JSON.stringify(shareData);
      const compressed = LZString.compressToEncodedURIComponent(jsonStr);
      const origin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'https://ebook-reader-app.vercel.app' 
        : window.location.origin;
      const shareUrl = `${origin}${window.location.pathname}#share=${compressed}`;
      
      await navigator.clipboard.writeText(shareUrl);
      triggerEditNotice('🔗 共有用URLをクリップボードにコピーしました！');
    } catch (err) {
      console.error(err);
      triggerEditNotice('❌ URLの生成に失敗しました');
    } finally {
      setShareLinkLoading(false);
    }
  };

  const currentCharIndex = useMemo(() => {
    if (!singlePages || singlePages.length === 0) return 0;
    // 現在表示中のシングルページインデックスを特定
    const singleIdx = isTwoPageSpread ? currentPageIndex * 2 : currentPageIndex;
    const page = singlePages[Math.min(singleIdx, singlePages.length - 1)];
    return page ? page.startIndex : 0;
  }, [singlePages, currentPageIndex, isTwoPageSpread]);

  const readProgressPercent = useMemo(() => {
    if (totalCharCount === 0) return 0;
    return Math.min(100, Math.round((currentCharIndex / Math.max(1, liveEditingText.length)) * 100));
  }, [currentCharIndex, totalCharCount, liveEditingText.length]);

  // 🔖【読書進捗＆どこまで読み進めたかの履歴オート保存】
  useEffect(() => {
    if (!bookTitle) return;
    try {
      const nowStr = new Date().toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      const currentVal = currentPageIndex + 1;
      const maxVal = maxIndex + 1;
      const progress = Math.min(100, Math.round((currentVal / Math.max(1, maxVal)) * 100));

      const historyData = {
        bookTitle,
        authorName,
        lastReadPageIndex: currentPageIndex,
        totalSinglePages,
        progressPercent: progress,
        lastReadTime: nowStr,
        isTwoPageSpread
      };

      const existingHistoryStr = localStorage.getItem('ebook_reading_history_v1');
      let historyList: any[] = existingHistoryStr ? JSON.parse(existingHistoryStr) : [];
      
      historyList = historyList.filter(h => h.bookTitle !== bookTitle);
      historyList.unshift(historyData);

      if (!isSharedMode) {
        localStorage.setItem('ebook_reading_history_v1', JSON.stringify(historyList.slice(0, 20)));
      }
    } catch (e) {
      console.error('Failed to record reading history', e);
    }
  }, [currentPageIndex, totalSinglePages, bookTitle, authorName, isTwoPageSpread, maxIndex]);

  useEffect(() => {
    if (currentPageIndex > maxIndex) {
      setCurrentPageIndex(maxIndex);
    }
  }, [maxIndex, currentPageIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLiveEditMode) return;
      if (e.key === 'ArrowLeft') {
        if (pageDirection === 'rtl') {
          handleNextPage();
        } else {
          handlePrevPage();
        }
      } else if (e.key === 'ArrowRight') {
        if (pageDirection === 'rtl') {
          handlePrevPage();
        } else {
          handleNextPage();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, pageDirection, isLiveEditMode, maxIndex]);

  // 🎯【文字選択がない単クリック・外側クリックでの自動消去判定】
  useEffect(() => {
    const handleDocumentMouseDown = (e: MouseEvent) => {
      if (toolbarMenuRef.current && toolbarMenuRef.current.contains(e.target as Node)) {
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        setPageSelection(null);
      }
    };

    window.addEventListener('mousedown', handleDocumentMouseDown);
    return () => window.removeEventListener('mousedown', handleDocumentMouseDown);
  }, []);

  // 🚀【原稿テキストエリアの微細スライダースクロール ＆ 左右◀▶1行微調整ボタンハンドラー】
  const handleScrollDeltaLines = (lineDelta: number) => {
    if (!liveTextareaRef.current) return;
    const el = liveTextareaRef.current;
    const SINGLE_LINE_PX = 24.5;
    const targetTop = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, el.scrollTop + (lineDelta * SINGLE_LINE_PX)));
    el.scrollTop = targetTop;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(parseFloat(((targetTop / maxScroll) * 100).toFixed(1)));
    }
  };

  const handleScrollToTop = () => {
    if (!liveTextareaRef.current) return;
    liveTextareaRef.current.scrollTop = 0;
    liveTextareaRef.current.focus();
    liveTextareaRef.current.setSelectionRange(0, 0);
    setScrollProgress(0);
    triggerEditNotice('🔝 原稿の先頭へスクロールしました');
  };

  const handleScrollToBottom = () => {
    if (!liveTextareaRef.current) return;
    const el = liveTextareaRef.current;
    el.scrollTop = el.scrollHeight;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    setScrollProgress(100);
    triggerEditNotice('🔚 原稿の最下部へスクロールしました');
  };

  const handleSliderScrollFine = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setScrollProgress(val);
    if (!liveTextareaRef.current) return;
    const el = liveTextareaRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = (val / 100) * maxScroll;
  };

  const handleTextareaScrollEvent = () => {
    if (!liveTextareaRef.current) return;
    const el = liveTextareaRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll > 0) {
      const pct = parseFloat(((el.scrollTop / maxScroll) * 100).toFixed(1));
      setScrollProgress(pct);
    }
  };

  // 🎯【100%ドンピシャ完全位置合わせ：絶対文字位置＆直線比率ハイブリッド同期エンジン】
  const executeScrollToCurrentPageInTextarea = () => {
    if (!liveTextareaRef.current) return;
    const textarea = liveTextareaRef.current;
    const fullText = textarea.value;
    if (!fullText || fullText.length === 0) return;

    const targetSinglePageIndex = isTwoPageSpread 
      ? (pageDirection === 'rtl' ? currentPageIndex * 2 : currentPageIndex * 2) 
      : currentPageIndex;

    const targetPageBlock = singlePages[targetSinglePageIndex] || singlePages[0];

    let exactTargetPos = 0;

    if (targetPageBlock) {
      exactTargetPos = targetPageBlock.startIndex || 0;

      const cleanSnippet = (targetPageBlock.content || '')
        .split('\n')
        .map(l => l.trim())
        .find(l => l.length > 1);

      if (cleanSnippet) {
        const rawSearchNeedle = cleanSnippet
          .replace(/\[\/?bg(?:-\d+)?\]/g, '')
          .replace(/\[\/?ul\]/g, '')
          .replace(/\[注:.*?\]/g, '')
          .replace(/｜|《[^》]+》/g, '')
          .slice(0, 10);

        if (rawSearchNeedle) {
          const matchedPos = fullText.indexOf(rawSearchNeedle);
          if (matchedPos !== -1) {
            exactTargetPos = matchedPos;
          }
        }
      }
    }

    exactTargetPos = Math.min(fullText.length, Math.max(0, exactTargetPos));

    const scrollRatio = fullText.length > 0 ? (exactTargetPos / fullText.length) : 0;
    const maxScrollHeight = textarea.scrollHeight - textarea.clientHeight;
    const exactScrollTop = Math.max(0, Math.min(maxScrollHeight, scrollRatio * textarea.scrollHeight));

    textarea.focus();
    textarea.setSelectionRange(exactTargetPos, exactTargetPos);
    textarea.scrollTop = exactScrollTop;

    requestAnimationFrame(() => {
      if (liveTextareaRef.current) {
        liveTextareaRef.current.scrollTop = exactScrollTop;
        liveTextareaRef.current.setSelectionRange(exactTargetPos, exactTargetPos);
        const maxScroll = liveTextareaRef.current.scrollHeight - liveTextareaRef.current.clientHeight;
        if (maxScroll > 0) {
          setScrollProgress(parseFloat(((exactScrollTop / maxScroll) * 100).toFixed(1)));
        }
      }
    });

    triggerEditNotice(`🎯 P.${isTwoPageSpread ? (currentPageIndex * 2) + 1 : currentPageIndex + 1} の該当原稿位置へドンピシャ一致しました！`);
  };

  // 🚀【編集モードONの瞬間にDOMマウントを検知してダイレクトスクロール】
  useEffect(() => {
    if (isLiveEditMode) {
      const timer = setTimeout(() => {
        executeScrollToCurrentPageInTextarea();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLiveEditMode, currentPageIndex]);

  const toggleLiveEditAndScrollToCurrentPage = () => {
    setIsLiveEditMode(prev => !prev);
  };

  // 🚀【目次項目の×削除・解除エンジン】
  const handleRemoveTocItem = (title: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`目次項目『${title}』を解除・消去しますか？\n（原稿内の見出し指定が標準テキストへ巻き戻されます）`)) {
      return;
    }

    const lines = liveEditingText.split('\n');
    let removedCount = 0;

    const newLines = lines.map(line => {
      const trimmed = line.trim();
      const cleanLineTitle = trimmed
        .replace(/^#\s*|^##\s*|^■\s*/, '')
        .replace(/\[\/?bg(?:-\d+)?\]/g, '')
        .replace(/\[\/?ul\]/g, '')
        .replace(/\[注:.*?\]/g, '')
        .replace(/｜|《[^》]+》/g, '');

      if (cleanLineTitle === title) {
        removedCount++;
        return line.replace(/^#\s*|^##\s*|^■\s*/, '');
      }
      return line;
    });

    if (removedCount > 0) {
      const updatedText = newLines.join('\n');
      handleSaveLiveEdit(updatedText, true);
      triggerEditNotice(`🗑️ 目次項目『${title}』を解除・消去しました！`);
    } else {
      triggerEditNotice(`⚠️ 目次項目『${title}』の削除対象が見つかりませんでした。`);
    }
  };

  // 🚀【文字や文章を「ドラッグ選択」した時だけ確実に出現させる厳格ハンドラー】
  const handlePaperTextMouseUp = (e: React.MouseEvent) => {
    if (isDraggingToolbar) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setPageSelection(null);
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length === 0) {
      setPageSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setPageSelection({
      text: selectedText,
      x: rect.left + window.scrollX + (rect.width / 2),
      y: Math.max(10, rect.top + window.scrollY - 54)
    });
  };

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    if (!pageSelection) return;
    setIsDraggingToolbar(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pageSelection.x,
      initialY: pageSelection.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingToolbar || !pageSelection) return;
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;
      setPageSelection({
        ...pageSelection,
        x: dragStartRef.current.initialX + deltaX,
        y: dragStartRef.current.initialY + deltaY
      });
    };

    const handleMouseUp = () => {
      if (isDraggingToolbar) {
        setIsDraggingToolbar(false);
      }
    };

    if (isDraggingToolbar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingToolbar, pageSelection]);

  const handleRegisterDirectSelectionToToc = (level: 1 | 2) => {
    if (!pageSelection || !pageSelection.text) return;
    const targetText = pageSelection.text.trim();

    const pos = liveEditingText.indexOf(targetText);
    
    let newText = '';
    const headingSymbol = level === 1 ? `\n\n# ${targetText}\n\n` : `\n\n■ ${targetText}\n\n`;

    if (pos !== -1) {
      newText = liveEditingText.substring(0, pos) + headingSymbol + liveEditingText.substring(pos + targetText.length);
    } else {
      const lines = liveEditingText.split('\n');
      const targetLineIdx = lines.findIndex(line => line.includes(targetText.slice(0, 5)));
      if (targetLineIdx !== -1) {
        lines[targetLineIdx] = level === 1 ? `# ${lines[targetLineIdx]}` : `■ ${lines[targetLineIdx]}`;
        newText = lines.join('\n');
      } else {
        newText = headingSymbol + liveEditingText;
      }
    }

    handleSaveLiveEdit(newText, true);
    setPageSelection(null);
    window.getSelection()?.removeAllRanges();

    const label = level === 1 ? '章見出し(大)' : '小見出し(中)';
    triggerEditNotice(`📌 なぞった文章『${targetText.slice(0, 10)}...』を【${label}】として目次へ連動追加しました！`);
    setShowTocSidebar(true);
  };

  const handleSaveLiveEdit = (newText: string, isMajorChange = false) => {
    if (isMajorChange || Math.abs(newText.length - liveEditingText.length) > 3) {
      setHistoryStack(prev => [...prev.slice(-20), liveEditingText]);
    }
    setLiveEditingText(newText);
    if (setRawText) {
      setRawText(newText);
    }
  };

  const handleUndoInReader = () => {
    if (historyStack.length === 0) {
      triggerEditNotice('⚠️ これ以上戻せる履歴がありません');
      return;
    }
    const previousText = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    setLiveEditingText(previousText);
    if (setRawText) {
      setRawText(previousText);
    }
    triggerEditNotice('↩️ 1つ前の編集状態に戻しました！');
  };

  const handleWrapSelection = (tagType: 'h1' | 'h2') => {
    if (!liveTextareaRef.current) return;
    
    const textarea = liveTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = liveEditingText.substring(start, end).trim();

    if (!selection) {
      alert('【使い方】原稿のテキストエリアから、目次（章・小見出し）にしたい文章をドラッグ選択してからボタンを押してください。');
      return;
    }

    let formatted = '';
    let msg = '';

    if (tagType === 'h1') {
      formatted = `\n\n# ${selection}\n\n`;
      msg = `📌 選択した文章 『${selection.slice(0, 12)}...』 を【章見出し(大)】として目次登録・連動しました！`;
    } else if (tagType === 'h2') {
      formatted = `\n\n■ ${selection}\n\n`;
      msg = `📌 選択した文章 『${selection.slice(0, 12)}...』 を【小見出し(中)】として目次登録・連動しました！`;
    }
    
    const newText = liveEditingText.substring(0, start) + formatted + liveEditingText.substring(end);
    handleSaveLiveEdit(newText, true);
    triggerEditNotice(msg);
  };

  const triggerEditNotice = (msg: string) => {
    setEditNotice(msg);
    setTimeout(() => setEditNotice(null), 3000);
  };

  // 🚀【次へ・前へボタン押下時に選択バーを強制消去するハンドラー】
  const handleNextPage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPageSelection(null);
    try { window.getSelection()?.removeAllRanges(); } catch (err) {}
    setCurrentPageIndex(prev => Math.min(maxIndex, prev + 1));
  };

  const handlePrevPage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPageSelection(null);
    try { window.getSelection()?.removeAllRanges(); } catch (err) {}
    setCurrentPageIndex(prev => Math.max(0, prev - 1));
  };

  const toggleHeadingStyle = () => {
    const nextStyle = headingStyle === 'tobira' ? 'inline' : 'tobira';
    setTypography(prev => ({
      ...prev,
      headingStyle: nextStyle
    }));
    triggerEditNotice(nextStyle === 'tobira' ? '📜 豪華【章扉】形式に切替ました' : '📝 【流し見出し】形式に切替ました');
  };

  const handleJumpToPage = (pageNumber: number) => {
    setPageSelection(null);
    try { window.getSelection()?.removeAllRanges(); } catch (err) {}
    const targetIndex = isTwoPageSpread ? Math.floor((pageNumber - 1) / 2) : pageNumber - 1;
    setCurrentPageIndex(Math.min(maxIndex, Math.max(0, targetIndex)));
    setShowTocSidebar(false);
  };

  const currentSpread = spreadPages[currentPageIndex] || { first: { content: '', isTobira: false, startIndex: 0 }, second: { content: '', isTobira: false, startIndex: 0 } };
  const leftPageObj = pageDirection === 'rtl' ? currentSpread.second : currentSpread.first;
  const rightPageObj = pageDirection === 'rtl' ? currentSpread.first : currentSpread.second;
  const currentSinglePage = singlePages[currentPageIndex] || { content: '', isTobira: false, startIndex: 0 };

  const nextButton = (
    <button
      onClick={(e) => handleNextPage(e)}
      disabled={currentPageIndex >= maxIndex}
      style={{
        padding: '8px 20px',
        borderRadius: '10px',
        backgroundColor: currentPageIndex >= maxIndex ? '#1E293B' : '#4F46E5',
        color: '#FFFFFF',
        fontSize: '12px',
        fontWeight: '900',
        border: 'none',
        cursor: currentPageIndex >= maxIndex ? 'not-allowed' : 'pointer',
        opacity: currentPageIndex >= maxIndex ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {pageDirection === 'rtl' && <ChevronLeft style={{ width: '16px', height: '16px', color: '#FDE047' }} />}
      次のページへ ▶
      {pageDirection === 'ltr' && <ChevronRightIcon style={{ width: '16px', height: '16px', color: '#FDE047' }} />}
    </button>
  );

  const prevButton = (
    <button
      onClick={(e) => handlePrevPage(e)}
      disabled={currentPageIndex <= 0}
      style={{
        padding: '8px 20px',
        borderRadius: '10px',
        backgroundColor: currentPageIndex <= 0 ? '#1E293B' : '#334155',
        color: '#FFFFFF',
        fontSize: '12px',
        fontWeight: '900',
        border: 'none',
        cursor: currentPageIndex <= 0 ? 'not-allowed' : 'pointer',
        opacity: currentPageIndex <= 0 ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {pageDirection === 'ltr' && <ChevronLeft style={{ width: '16px', height: '16px', color: '#CBD5E1' }} />}
      ◀ 前のページへ
      {pageDirection === 'rtl' && <ChevronRightIcon style={{ width: '16px', height: '16px', color: '#CBD5E1' }} />}
    </button>
  );

  return (
    <div style={{ width: '100%', maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* ツールバー */}
      <div className="glass-panel" style={{ width: '100%', padding: '14px 20px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isSharedMode && (
            <button
              onClick={onBackToStudio}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', color: '#FFF', backgroundColor: '#334155', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} /> 原稿スタジオに戻る
            </button>
          )}
          
          {isSharedMode && (
            <div style={{ padding: '6px 12px', backgroundColor: '#FDE047', color: '#0F172A', borderRadius: '8px', fontSize: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen style={{ width: '14px', height: '14px' }} /> 閲覧プレビューモード
            </div>
          )}
        </div>

        {/* コントローラー：紙質・書体・文字サイズ・1行文字数・1頁行数 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(15,23,42,0.9)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.4)', flexWrap: 'wrap' }}>
          
          {/* 🎨 1. 紙質テーマ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#FDE047', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <BookOpen style={{ width: '13px', height: '13px' }} /> 紙質:
            </span>
            <select
              value={paperTheme}
              onChange={(e) => setTypography(prev => ({ ...prev, paperTheme: e.target.value as PaperTheme }))}
              style={{ backgroundColor: '#0F172A', color: '#FDE047', border: '1px solid #4F46E5', borderRadius: '6px', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
            >
              <option value="bunkobon">📖 文庫本(生成り)</option>
              <option value="sepia">📜 セピア(古書)</option>
              <option value="dark">🌙 夜間(ダーク)</option>
              <option value="white">☀️ ホワイト</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* 🔤 2. 書体フォント */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Type style={{ width: '13px', height: '13px' }} /> 書体:
            </span>
            <select
              value={fontTheme}
              onChange={(e) => setTypography(prev => ({ ...prev, fontTheme: e.target.value as FontTheme }))}
              style={{ backgroundColor: '#0F172A', color: '#38BDF8', border: '1px solid #0284C7', borderRadius: '6px', padding: '2px 6px', fontSize: '11px', fontWeight: 'bold', outline: 'none', cursor: 'pointer' }}
            >
              <option value="shippori">しっぽり高級明朝</option>
              <option value="serif">標準明朝体</option>
              <option value="sans">モダンゴシック</option>
              <option value="zen">丸ゴシック</option>
            </select>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* 🎯 3. 文字サイズ (pt) 直接変更ボタン */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#F59E0B' }}>大小:</span>
            <button
              onClick={() => {
                const nextSize = Math.max(12, fontSize - 1);
                setTypography(prev => ({ ...prev, fontSize: nextSize }));
                triggerEditNotice(`🔍 文字サイズを ${nextSize}pt に変更しました！`);
              }}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              -
            </button>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#FDE047', minWidth: '28px', textAlign: 'center' }}>
              {fontSize}pt
            </span>
            <button
              onClick={() => {
                const nextSize = Math.min(36, fontSize + 1);
                setTypography(prev => ({ ...prev, fontSize: nextSize }));
                triggerEditNotice(`🔍 文字サイズを ${nextSize}pt に変更しました！`);
              }}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              +
            </button>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* 4. 1行文字数 (字) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#38BDF8' }}>📏 1行:</span>
            <button
              onClick={() => {
                const nextVal = Math.max(6, charsPerLine - 1);
                setTypography(prev => ({ ...prev, charsPerLine: nextVal }));
                triggerEditNotice(`📏 1行の文字数を ${nextVal}字 に再組版しました！`);
              }}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              -
            </button>
            <span
              title={charsPerLine > physicalMaxCharsUI ? `現在のフォントサイズでの物理上限は${physicalMaxCharsUI}字。フォントサイズを小さくすると有効になります` : ''}
              style={{ fontSize: '12px', fontWeight: '900', color: charsPerLine > physicalMaxCharsUI ? '#F87171' : '#FDE047', minWidth: '32px', textAlign: 'center', cursor: charsPerLine > physicalMaxCharsUI ? 'help' : 'default' }}
            >
              {charsPerLine}字{charsPerLine > physicalMaxCharsUI ? `→${physicalMaxCharsUI}` : ''}
            </span>
            <button
              onClick={() => {
                if (charsPerLine >= physicalMaxCharsUI) {
                  triggerEditNotice(`⚠️ これ以上増やすにはフォントサイズを小さくしてください（物理的な紙の高さに収まりません）`);
                  return;
                }
                const nextVal = Math.min(40, charsPerLine + 1);
                setTypography(prev => ({ ...prev, charsPerLine: nextVal }));
                triggerEditNotice(`📏 1行の文字数を ${nextVal}字 に設定しました！`);
              }}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: charsPerLine >= physicalMaxCharsUI ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              +
            </button>
          </div>

          <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* 5. 1頁行数 (行) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#38BDF8' }}>📄 1頁:</span>
            <button
              onClick={() => setTypography(prev => ({ ...prev, linesPerPage: Math.max(5, linesPerPage - 1) }))}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              -
            </button>
            <span style={{ fontSize: '12px', fontWeight: '900', color: '#FDE047', minWidth: '28px', textAlign: 'center' }}>
              {linesPerPage}行
            </span>
            <button
              onClick={() => setTypography(prev => ({ ...prev, linesPerPage: Math.min(25, linesPerPage + 1) }))}
              style={{ backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #4F46E5', borderRadius: '4px', width: '20px', height: '20px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              +
            </button>
          </div>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          
          {/* 半角ツメ ON/OFF */}
          <button
            onClick={() => setIsHalfWidthPacking(!isHalfWidthPacking)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: isHalfWidthPacking ? '#065F46' : '#1E293B',
              color: isHalfWidthPacking ? '#34D399' : '#94A3B8',
              border: isHalfWidthPacking ? '1px solid #059669' : '1px solid rgba(148,163,184,0.4)',
              fontSize: '11px',
              fontWeight: '900',
              cursor: 'pointer'
            }}
          >
            {isHalfWidthPacking ? '🔤 「」ツメ: ON' : '🔤 「」ツメ: OFF'}
          </button>

          {!isSharedMode && (
            <button
              onClick={handleCreateShareLink}
              disabled={shareLinkLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: shareLinkLoading ? '#64748B' : '#0284C7',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '900',
                cursor: shareLinkLoading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="この状態のリーダーをプレビューできる共有リンク（URL）をコピー"
            >
              <Share2 style={{ width: '14px', height: '14px' }} />
              {shareLinkLoading ? '圧縮中...' : '🔗 共有URLをコピー'}
            </button>
          )}

          {/* 自動補正 ON/OFF */}
          <button
            onClick={() => setIsSmartAutoFlow(!isSmartAutoFlow)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: isSmartAutoFlow ? '#166534' : '#1E293B',
              color: isSmartAutoFlow ? '#4ADE80' : '#94A3B8',
              border: isSmartAutoFlow ? '1px solid #22C55E' : '1px solid rgba(148,163,184,0.4)',
              fontSize: '11px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <Wand2 style={{ width: '13px', height: '13px' }} />
            {isSmartAutoFlow ? '✨ 自動補正: ON' : '✨ 自動補正: OFF'}
          </button>

          {/* 章扉 / 流し見出し */}
          <button
            onClick={toggleHeadingStyle}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: headingStyle === 'tobira' ? '#854D0E' : '#1E293B',
              color: headingStyle === 'tobira' ? '#FDE047' : '#94A3B8',
              border: '1px solid rgba(245,158,11,0.5)',
              fontSize: '11px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            {headingStyle === 'tobira' ? <BookOpenCheck style={{ width: '13px', height: '13px' }} /> : <FileText style={{ width: '13px', height: '13px' }} />}
            {headingStyle === 'tobira' ? '📜 豪華章扉' : '📝 流し見出し'}
          </button>

          {/* 右開き / 左開き */}
          <button
            onClick={() => setPageDirection(prev => prev === 'rtl' ? 'ltr' : 'rtl')}
            style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: '#312E81', color: '#FFF', fontSize: '11px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
          >
            {pageDirection === 'rtl' ? '📖 右開き' : '📖 左開き'}
          </button>

          {/* 見開き / 単P */}
          <button
            onClick={() => setIsTwoPageSpread(!isTwoPageSpread)}
            style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: '#1E1B4B', color: '#F59E0B', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(245,158,11,0.5)', cursor: 'pointer' }}
          >
            {isTwoPageSpread ? '見開き2P' : '単P'}
          </button>

          {/* 📥 EPUB3エクスポートボタン */}
          <button
            onClick={() => exportBookToEpub(bookTitle, authorName, liveEditingText)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '11px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              boxShadow: '0 4px 10px rgba(5, 150, 105, 0.4)'
            }}
          >
            <Download style={{ width: '13px', height: '13px', color: '#FDE047' }} />
            EPUB3保存
          </button>

          {/* ✏️【編集モード切替＆該当ページドンピシャ100%スクロールボタン】 */}
          <button
            onClick={toggleLiveEditAndScrollToCurrentPage}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: isLiveEditMode ? '#0284C7' : '#1E293B',
              color: isLiveEditMode ? '#FFFFFF' : '#38BDF8',
              border: isLiveEditMode ? '1px solid #38BDF8' : '1px solid rgba(56,189,248,0.4)',
              fontSize: '11px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Edit3 style={{ width: '13px', height: '13px' }} />
            {isLiveEditMode ? '編集モード中' : `P.${isTwoPageSpread ? (currentPageIndex * 2) + 1 : currentPageIndex + 1} 編集`}
          </button>

          <button
            onClick={() => setShowTocSidebar(!showTocSidebar)}
            style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: showTocSidebar ? '#F59E0B' : '#1E1B4B', color: showTocSidebar ? '#020617' : '#A5B4FC', border: '1px solid rgba(245,158,11,0.5)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <ListTree style={{ width: '13px', height: '13px', display: 'inline', marginRight: '3px' }} />
            目次 ({computedTocItems.length})
          </button>
        </div>
      </div>

      {editNotice && (
        <div style={{ width: '100%', backgroundColor: '#0284C7', color: '#FFF', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', marginBottom: '14px' }}>
          <Sparkles style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
          {editNotice}
        </div>
      )}

      {/* ✏️【原稿編集パネル ＋ スクロールバー左右◀▶微調整ボタン完備】 */}
      {isLiveEditMode && (
        <div 
          className="glass-panel" 
          style={{ 
            width: '100%', 
            maxWidth: isTwoPageSpread ? '920px' : '480px', 
            margin: '0 auto 20px auto', 
            padding: '16px 20px', 
            backgroundColor: '#0F172A', 
            border: '2px solid #0284C7',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 style={{ width: '16px', height: '16px', color: '#FDE047' }} />
              P.{isTwoPageSpread ? (currentPageIndex * 2) + 1 : currentPageIndex + 1} の原稿テキスト自由編集
            </span>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={() => handleWrapSelection('h1')}
                style={{ padding: '6px 14px', backgroundColor: '#F59E0B', color: '#020617', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <BookmarkPlus style={{ width: '14px', height: '14px' }} /> 📌 章見出し(大)
              </button>

              <button
                onClick={() => handleWrapSelection('h2')}
                style={{ padding: '6px 14px', backgroundColor: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Heading2 style={{ width: '14px', height: '14px' }} /> ■ 小見出し(中)
              </button>

              <button
                onClick={handleUndoInReader}
                style={{ padding: '6px 12px', backgroundColor: '#334155', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Undo
              </button>
            </div>
          </div>

          {/* 🎛️【左右◀▶微調整ボタン付き原稿スクロールバー】 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#020617', padding: '8px 14px', borderRadius: '10px', marginBottom: '10px', border: '1px solid #1E293B', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
              <Sliders style={{ width: '14px', height: '14px', color: '#38BDF8' }} /> 位置 ({scrollProgress}%):
            </span>

            {/* ◀ 左微調整ボタン（1行上へ） */}
            <button
              onClick={() => handleScrollDeltaLines(-1)}
              style={{
                padding: '4px 10px',
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                border: '1px solid #0284C7',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
              }}
              title="1行上へスクロール（微調整）"
            >
              ◀
            </button>

            {/* 🎛️ スライダーバー */}
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={scrollProgress}
              onChange={handleSliderScrollFine}
              style={{ flex: 1, minWidth: '120px', cursor: 'pointer', accentColor: '#38BDF8' }}
              title="ドラッグで原稿の好きな位置へ滑らかスクロール"
            />

            {/* ▶ 右微調整ボタン（1行下へ） */}
            <button
              onClick={() => handleScrollDeltaLines(1)}
              style={{
                padding: '4px 10px',
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                border: '1px solid #0284C7',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
              }}
              title="1行下へスクロール（微調整）"
            >
              ▶
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
              <button
                onClick={handleScrollToTop}
                style={{ padding: '3px 8px', backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #334155', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🔝 先頭
              </button>
              <button
                onClick={handleScrollToBottom}
                style={{ padding: '3px 8px', backgroundColor: '#1E293B', color: '#FFF', border: '1px solid #334155', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🔚 末尾
              </button>
            </div>
          </div>

          <textarea
            ref={liveTextareaRef}
            value={liveEditingText}
            onChange={(e) => handleSaveLiveEdit(e.target.value)}
            onScroll={handleTextareaScrollEvent}
            style={{
              width: '100%',
              height: '360px',
              backgroundColor: '#020617',
              color: '#F8FAFC',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              lineHeight: '1.75',
              fontFamily: "'Courier New', Courier, monospace",
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* 🚀【MAIN CONTAINER】 */}
      <div style={{ width: '100%', display: 'flex', gap: '20px', alignItems: 'start', justifyContent: 'center', position: 'relative' }}>
        
        {/* 目次サイドバー */}
        {showTocSidebar && (
          <div className="glass-panel" style={{ width: '300px', minHeight: '560px', padding: '18px', display: 'flex', flexDirection: 'column', backgroundColor: '#0B132B', border: '1px solid #4F46E5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <ListTree style={{ width: '16px', height: '16px', color: '#F59E0B' }} />
                連動目次 (全 {computedTocItems.length} 項目)
              </h3>
              <button onClick={() => setShowTocSidebar(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {computedTocItems.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>
                  （原稿内にまだ目次見出しがありません）<br />
                  紙面上で文字をドラッグ選択して「📌 章見出し」または「■ 小見出し」を押すと、ここに連動目次が自動登録されます！
                </div>
              ) : (
                computedTocItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleJumpToPage(item.pageNumber)}
                    style={{
                      padding: item.level === 1 ? '10px 12px' : '8px 10px 8px 20px',
                      borderRadius: '8px',
                      backgroundColor: (currentPageIndex + 1) === item.pageNumber ? '#1E1B4B' : '#0F172A',
                      border: (currentPageIndex + 1) === item.pageNumber ? '1px solid #F59E0B' : '1px solid #1E293B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                  >
                    <span style={{ fontSize: item.level === 1 ? '12px' : '11px', fontWeight: item.level === 1 ? '900' : 'bold', color: item.level === 1 ? '#FFF' : '#38BDF8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                      {item.level === 1 ? '📌 ' : '■ '}{item.title}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                        P.{item.pageNumber}
                      </span>

                      <button
                        onClick={(e) => handleRemoveTocItem(item.title, e)}
                        style={{
                          backgroundColor: '#EF4444',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
                        }}
                        title={`目次項目『${item.title}』を消去・解除`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 🚀【紙面リーダーコンテナ：100%全文字欠損・のど隠れ・オーバーフロー防止 ＆ 文字サイズ直接適用型】 */}
        <div 
          ref={paperContainerRef}
          onMouseUp={handlePaperTextMouseUp}
          className="reader-paper-view"
          style={{
            width: '100%',
            maxWidth: isTwoPageSpread ? '920px' : '480px',
            minHeight: '560px',
            borderRadius: '20px',
            padding: '24px 30px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            backgroundColor: themeStyles.bg,
            color: themeStyles.textClr,
            border: isLiveEditMode ? '2px solid #0284C7' : '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            transition: 'background-color 0.3s ease, color 0.3s ease',
            position: 'relative',
            userSelect: 'text'
          }}
        >
          {/* 本文表示領域（440px固定高さ） */}
          <div style={{ width: '100%', height: `${FIXED_PAPER_HEIGHT}px`, overflow: 'hidden' }}>
            {bookType === 'comic' ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {comicPages[currentPageIndex] && (
                  <img
                    src={comicPages[currentPageIndex].imageUrl}
                    alt={`Comic Page ${currentPageIndex + 1}`}
                    style={{ maxHeight: `${FIXED_PAPER_HEIGHT}px`, maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                  />
                )}
              </div>
            ) : isTwoPageSpread ? (
              <div style={{ display: 'flex', width: '100%', height: '100%', gap: '32px', justifyContent: 'space-between', overflow: 'hidden' }}>
                
                {/* 左ページ */}
                <div 
                  style={{ 
                    flex: 1, 
                    height: '100%',
                    writingMode: 'vertical-rl', 
                    WebkitWritingMode: 'vertical-rl',
                    fontSize: leftPageObj.isTobira ? '22px' : `${fontSize}px`, 
                    lineHeight: leftPageObj.isTobira ? 1.8 : dynamicLineHeight,
                    letterSpacing: '0.01em',
                    fontFamily: themeStyles.fontFamily,
                    whiteSpace: 'pre',
                    wordBreak: 'break-all',
                    overflow: 'hidden',
                    padding: '24px 16px',
                    boxSizing: 'border-box',
                    fontFeatureSettings: isHalfWidthPacking ? '"vpal" 1, "vkrn" 1, "palt" 1, "pkna" 1' : '"vkrn" 1'
                  }}
                  className={`${leftPageObj.isTobira ? 'pure-tobira-page' : ''} vertical-natural-text`}
                >
                  {leftPageObj && leftPageObj.content ? renderPureJSXWithAllFeatures(leftPageObj.content, (t, n) => setActiveFootnote({ title: t, note: n })) : <span style={{ opacity: 0.2 }}>（終端）</span>}
                </div>

                <div style={{ width: '1px', height: '100%', backgroundColor: 'rgba(148,163,184,0.3)', flexShrink: 0 }} />

                {/* 右ページ */}
                <div 
                  style={{ 
                    flex: 1, 
                    height: '100%',
                    writingMode: 'vertical-rl', 
                    WebkitWritingMode: 'vertical-rl',
                    fontSize: rightPageObj.isTobira ? '22px' : `${fontSize}px`, 
                    lineHeight: rightPageObj.isTobira ? 1.8 : dynamicLineHeight,
                    letterSpacing: '0.01em',
                    fontFamily: themeStyles.fontFamily,
                    whiteSpace: 'pre',
                    wordBreak: 'break-all',
                    overflow: 'hidden',
                    padding: '24px 16px',
                    boxSizing: 'border-box',
                    fontFeatureSettings: isHalfWidthPacking ? '"vpal" 1, "vkrn" 1, "palt" 1, "pkna" 1' : '"vkrn" 1'
                  }}
                  className={`${rightPageObj.isTobira ? 'pure-tobira-page' : ''} vertical-natural-text`}
                >
                  {rightPageObj && rightPageObj.content ? renderPureJSXWithAllFeatures(rightPageObj.content, (t, n) => setActiveFootnote({ title: t, note: n })) : <span style={{ opacity: 0.2 }}>（終端）</span>}
                </div>

              </div>
            ) : (
              <div 
                style={{ 
                  width: '100%', 
                  height: '100%',
                  writingMode: 'vertical-rl', 
                  WebkitWritingMode: 'vertical-rl',
                  fontSize: currentSinglePage.isTobira ? '22px' : `${fontSize}px`, 
                  lineHeight: currentSinglePage.isTobira ? 1.8 : dynamicLineHeight,
                  letterSpacing: '0.01em',
                  fontFamily: themeStyles.fontFamily,
                  whiteSpace: 'pre',
                  wordBreak: 'break-all',
                  overflow: 'hidden',
                  padding: '24px 16px',
                  boxSizing: 'border-box',
                  fontFeatureSettings: isHalfWidthPacking ? '"vpal" 1, "vkrn" 1, "palt" 1, "pkna" 1' : '"vkrn" 1'
                }}
                className={`${currentSinglePage.isTobira ? 'pure-tobira-page' : ''} vertical-natural-text`}
              >
                {renderPureJSXWithAllFeatures(currentSinglePage.content, (t, n) => setActiveFootnote({ title: t, note: n }))}
              </div>
            )}
          </div>

          {/* ページナビ（縦書き右開きRTL標準：右側が『最初へ』、左側が『最後へ』） */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: '12px', marginTop: '10px' }}>
            
            {/* 左側：読み進める先（最後へ ⏭️ ＆ 進行ボタン） */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* ⏭️ 最後へジャンプボタン（左配置） */}
              <button
                onClick={() => setCurrentPageIndex(isTwoPageSpread ? Math.max(0, Math.ceil(totalSinglePages / 2) - 1) : Math.max(0, totalSinglePages - 1))}
                disabled={currentPageIndex >= (isTwoPageSpread ? Math.ceil(totalSinglePages / 2) - 1 : totalSinglePages - 1)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentPageIndex >= (isTwoPageSpread ? Math.ceil(totalSinglePages / 2) - 1 : totalSinglePages - 1) ? 'rgba(30,41,59,0.5)' : '#0284C7',
                  color: currentPageIndex >= (isTwoPageSpread ? Math.ceil(totalSinglePages / 2) - 1 : totalSinglePages - 1) ? '#64748B' : '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: currentPageIndex >= (isTwoPageSpread ? Math.ceil(totalSinglePages / 2) - 1 : totalSinglePages - 1) ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="最後（最終ページ）にジャンプ"
              >
                最後へ ⏭️
              </button>
              {pageDirection === 'rtl' ? nextButton : prevButton}
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '900' }}>
                {isTwoPageSpread ? (
                  <span>見開き <strong style={{ color: paperTheme === 'dark' ? '#FDE047' : '#0284C7', fontSize: '16px' }}>P. {(currentPageIndex * 2) + 1} - {Math.min((currentPageIndex * 2) + 2, totalSinglePages)}</strong> / 全 {totalSinglePages} 頁</span>
                ) : (
                  <span>P. <strong style={{ color: paperTheme === 'dark' ? '#FDE047' : '#0284C7', fontSize: '16px' }}>{currentPageIndex + 1}</strong> / 全 {totalSinglePages} 頁</span>
                )}
              </span>
            </div>

            {/* 右側：読書の始点（最初へ ⏮️ ＆ 戻りボタン） */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {pageDirection === 'rtl' ? prevButton : nextButton}
              {/* ⏮️ 最初へジャンプボタン（右配置） */}
              <button
                onClick={() => setCurrentPageIndex(0)}
                disabled={currentPageIndex === 0}
                style={{
                  padding: '6px 12px',
                  backgroundColor: currentPageIndex === 0 ? 'rgba(30,41,59,0.5)' : '#0284C7',
                  color: currentPageIndex === 0 ? '#64748B' : '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: currentPageIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="最初（1ページ目 / 表紙）にジャンプ"
              >
                ⏮️ 最初へ
              </button>
            </div>
          </div>

          {/* 📊【総文字数・現在文字数バー】 */}
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: 'rgba(15,23,42,0.6)',
            borderRadius: '10px',
            border: '1px solid rgba(148,163,184,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '600' }}>
                📖 現在位置
                <strong style={{ color: '#38BDF8', marginLeft: '6px', fontSize: '13px' }}>
                  {currentCharIndex.toLocaleString()}
                </strong>
                <span style={{ color: '#64748B', margin: '0 4px' }}>字</span>
                <span style={{ color: '#64748B' }}>/ 全</span>
                <strong style={{ color: '#FDE047', margin: '0 4px', fontSize: '13px' }}>
                  {liveEditingText.replace(/\s/g, '').length.toLocaleString()}
                </strong>
                <span style={{ color: '#64748B' }}>字</span>
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '900',
                color: readProgressPercent >= 80 ? '#4ADE80' : readProgressPercent >= 40 ? '#FDE047' : '#94A3B8',
                minWidth: '36px',
                textAlign: 'right'
              }}>
                {readProgressPercent}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(148,163,184,0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${readProgressPercent}%`,
                background: readProgressPercent >= 80
                  ? 'linear-gradient(90deg, #4ADE80, #22D3EE)'
                  : readProgressPercent >= 40
                  ? 'linear-gradient(90deg, #F59E0B, #FDE047)'
                  : 'linear-gradient(90deg, #6366F1, #38BDF8)',
                borderRadius: '2px',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

        </div>

      </div>

      {/* 🚀【文字ドラッグ選択時のみ確実に出現する！『見出し追加ツールバー Menu』】 */}
      {pageSelection && pageSelection.text && pageSelection.text.length > 0 && (
        <div 
          ref={toolbarMenuRef}
          style={{
            position: 'absolute',
            left: `${pageSelection.x}px`,
            top: `${pageSelection.y}px`,
            transform: 'translateX(-50%)',
            backgroundColor: '#0F172A',
            border: '2px solid #F59E0B',
            borderRadius: '14px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            cursor: isDraggingToolbar ? 'grabbing' : 'default',
            userSelect: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 🖐️ ドラッグ移動用つまみハンドル */}
          <div
            onMouseDown={handleToolbarMouseDown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              cursor: 'grab',
              padding: '2px 4px',
              backgroundColor: '#1E293B',
              borderRadius: '6px',
              color: '#FDE047'
            }}
            title="クリック＆ドラッグで自由な場所へツールバーを移動"
          >
            <GripVertical style={{ width: '16px', height: '16px', color: '#FDE047' }} />
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#FDE047' }}>移動</span>
          </div>

          <span style={{ fontSize: '11px', fontWeight: '900', color: '#38BDF8', whiteSpace: 'nowrap', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            『{pageSelection.text}』
          </span>

          <div style={{ width: '1px', height: '18px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

          {/* 📌 1. 章見出し(大)に登録 */}
          <button
            onClick={() => handleRegisterDirectSelectionToToc(1)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#F59E0B',
              color: '#020617',
              border: 'none',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(245,158,11,0.4)'
            }}
            title="選択した文字を【章見出し(大)】として目次へ追加"
          >
            <BookmarkPlus style={{ width: '14px', height: '14px' }} />
            📌 章見出し(大)
          </button>

          {/* ■ 2. 小見出し(中)に登録 */}
          <button
            onClick={() => handleRegisterDirectSelectionToToc(2)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 6px rgba(2,132,199,0.4)'
            }}
            title="選択した文字を【小見出し(中)】として目次へ追加"
          >
            <Heading2 style={{ width: '14px', height: '14px' }} />
            ■ 小見出し(中)
          </button>

          <button
            onClick={() => setPageSelection(null)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px', marginLeft: '4px' }}
            title="閉じる"
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* 📌 2. 脚注（用語解説ポップアップダイアログ） */}
      {activeFootnote && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
          onClick={() => setActiveFootnote(null)}
        >
          <div 
            style={{
              backgroundColor: '#0F172A',
              border: '2px solid #38BDF8',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#FDE047', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <HelpCircle style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
                {activeFootnote.title}
              </h3>
              <button onClick={() => setActiveFootnote(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.8', color: '#F8FAFC', margin: 0, whiteSpace: 'pre-wrap' }}>
              {activeFootnote.note}
            </p>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                onClick={() => setActiveFootnote(null)}
                style={{ backgroundColor: '#4F46E5', color: '#FFF', border: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
