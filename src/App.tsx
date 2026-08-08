import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { PublishStudio } from './components/PublishStudio';
import { CoverStudio } from './components/CoverStudio';
import { ReaderView } from './components/ReaderView';
import { StoreAnalytics } from './components/StoreAnalytics';
import { MyPage } from './components/MyPage';
import { DEFAULT_TYPOGRAPHY, DEFAULT_COVER, SAMPLE_TEXT_WEALTH_HAPPINESS, SAMPLE_TEXT_NOVEL, SAMPLE_COMIC_PAGES } from './data/sampleBooks';
import { TypographySettings, CoverSettings, BookItem, BookType, ComicPage, TocItem } from './types';
import { Sparkles, CheckCircle2, Save, Download, Upload, HardDrive, ShieldCheck, Clock, FileText, X, AlignLeft, RefreshCw, BookmarkPlus, LayoutTemplate, BookOpen } from 'lucide-react';
import LZString from 'lz-string';

const LOCAL_STORAGE_KEY = 'ebook_platform_draft_v2';
const MY_SAVED_BOOKS_STORAGE_KEY = 'ebook_platform_mypage_saved_books_v1';

const DEFAULT_TOC: TocItem[] = [];

export default function App() {
  const [activeTab, setActiveTab] = useState<'publish' | 'cover' | 'reader' | 'store' | 'mypage' | 'split'>('reader');
  
  const [isSharedMode, setIsSharedMode] = useState(false);

  // State for E-Book & Comic Creation (改修・リロード時にも絶対に原稿が差し替わらない永続構造)
  const [bookType, setBookType] = useState<BookType>('reflow');
  
  const [bookTitle, setBookTitle] = useState(() => {
    try {
      const saved = localStorage.getItem('ebook_platform_draft_title_v2');
      if (saved) return saved;
    } catch (e) {}
    return '庶民から這い上がった超富裕層の幸福論';
  });

  const [authorName, setAuthorName] = useState(() => {
    try {
      const saved = localStorage.getItem('ebook_platform_draft_author_v2');
      if (saved) return saved;
    } catch (e) {}
    return '千代目';
  });

  const [rawText, setRawText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ebook_platform_draft_v2');
      if (saved && saved.length > 50) {
        // 旧形式: JSON全体が保存されている場合はパースしてrawTextだけを抽出
        if (saved.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.rawText && typeof parsed.rawText === 'string' && parsed.rawText.length > 50) {
              return parsed.rawText;
            }
          } catch (_) {
            // パース失敗時はそのまま使用
          }
        }
        return saved;
      }
    } catch (e) {}
    return SAMPLE_TEXT_WEALTH_HAPPINESS;
  });

  const [comicPages, setComicPages] = useState<ComicPage[]>(SAMPLE_COMIC_PAGES);
  const [typography, setTypography] = useState<TypographySettings>(DEFAULT_TYPOGRAPHY);
  const [cover, setCover] = useState<CoverSettings>({ ...DEFAULT_COVER, title: bookTitle || '庶民から這い上がった超富裕層の幸福論', author: authorName || '千代目' });
  const [tocItems, setTocItems] = useState<TocItem[]>(DEFAULT_TOC);

  // 原稿・タイトル変更時の即時ローカル永続保存（rawTextのみを保存、JSONを混在させない）
  useEffect(() => {
    if (isSharedMode) return; // 共有プレビュー時はローカル保存をバイパス
    try {
      if (rawText && !rawText.trim().startsWith('{')) {
        // JSONが混入していない場合のみ保存（旧形式の誤上書きを防止）
        localStorage.setItem('ebook_platform_draft_v2', rawText);
      }
      if (bookTitle) localStorage.setItem('ebook_platform_draft_title_v2', bookTitle);
      if (authorName) localStorage.setItem('ebook_platform_draft_author_v2', authorName);
    } catch (e) {}
  }, [rawText, bookTitle, authorName, isSharedMode]);

  // 🔗【URL共有リンクの自動展開】
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#share=')) {
      try {
        const compressed = hash.substring(7);
        const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
        if (jsonStr) {
          const shareData = JSON.parse(jsonStr);
          if (shareData.title) setBookTitle(shareData.title);
          if (shareData.author) setAuthorName(shareData.author);
          if (shareData.text) setRawText(shareData.text);
          if (shareData.typography) setTypography(shareData.typography);
          if (shareData.cover) setCover(shareData.cover);
          if (shareData.type) setBookType(shareData.type);
          if (shareData.comic) setComicPages(shareData.comic);
          
          setIsSharedMode(true);
          setActiveTab('reader'); // 強制的にリーダーを表示
          triggerToast('🔗 共有された作品プレビューを読み込みました！');
        }
      } catch (err) {
        console.error('Failed to parse share link', err);
        alert('共有リンクの読み込みに失敗しました。URLが正しくないか破損しています。');
      }
    }
  }, []);

  // 📚【マイページ保存作品ライブラリ State】
  const [mySavedBooks, setMySavedBooks] = useState<BookItem[]>(() => {
    return [{
      id: 'saved-wealth-1',
      title: '庶民から這い上がった超富裕層の幸福論',
      author: '千代目',
      genre: 'ビジネス・自己啓発',
      description: '著者・千代目様による長編原稿全本文。',
      bookType: 'reflow',
      readingDirection: 'rtl',
      cover: { ...DEFAULT_COVER, title: '庶民から這い上がった超富裕層の幸福論', author: '千代目' },
      typography: DEFAULT_TYPOGRAPHY,
      chapters: [{ id: 'ch-1', title: '●生き方と考え方', content: SAMPLE_TEXT_WEALTH_HAPPINESS }],
      price: 1500,
      salesCount: 15400,
      rating: 4.95,
      pageCount: 220,
      publishedAt: '2026-08-01'
    }];
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSavingAuto, setIsSavingAuto] = useState(false);

  const isFirstRenderRef = useRef(true);

  // 💾 マイページ保存ライブラリのLocalStorage自動更新
  // 🛡️【再発防止策1: タイムマシン自動原稿履歴スナップショット】
  const [historySnapshots, setHistorySnapshots] = useState<Array<{ time: string; text: string; title: string }>>(() => {
    try {
      const saved = localStorage.getItem('ebook_manuscript_history_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // テキスト変更時の自動スナップショット（デバウンス付き）
  useEffect(() => {
    if (isSharedMode) return;
    if (!rawText || rawText.length < 10) return;
    const timer = setTimeout(() => {
      setHistorySnapshots(prev => {
        // 直近と同じテキストなら追加しない
        if (prev.length > 0 && prev[0].text === rawText) return prev;
        const nowStr = new Date().toLocaleTimeString('ja-JP');
        const newSnap = { time: nowStr, text: rawText, title: bookTitle };
        const updated = [newSnap, ...prev].slice(0, 50); // 最新50件まで自動保持
        try {
          localStorage.setItem('ebook_manuscript_history_v1', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [rawText, bookTitle, isSharedMode]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // 📄【再発防止策2: ワンタップ即時テキスト退避保存 (.txt)】
  const handleQuickTextDownload = () => {
    if (!rawText) {
      alert('保存する原稿テキストがありません。');
      return;
    }
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (bookTitle || 'manuscript').replace(/[\\/:*?"<>|]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `${safeTitle}_原稿バックアップ_${dateStr}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`📄 原稿テキスト『${safeTitle}.txt』をPCにワンタップ保存しました！`);
  };

  // 🛡️【絶対上書き防止策: beforeunload 離脱警告プロテクト】
  useEffect(() => {
    if (isSharedMode) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (rawText && rawText.length > 50) {
        e.preventDefault();
        e.returnValue = '編集中の原稿が存在します。ページを移動すると変更が失われる可能性があります。';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [rawText, isSharedMode]);

  // ⚡『超富裕層の幸福論』元の全本文復元ハンドラー（編集中の安全ガード付き）
  const handleRestoreWealthBook = () => {
    if (rawText && rawText.length > 100) {
      if (!confirm('⚠️ 現在編集中の原稿があります。上書きしてサンプルデータを復元しますか？\n（キャンセルを押すと現在の原稿が保護されます）')) {
        return;
      }
    }
    setBookTitle('超富裕層の幸福論');
    setAuthorName('千代目');
    setRawText(SAMPLE_TEXT_WEALTH_HAPPINESS);
    setTypography({
      ...DEFAULT_TYPOGRAPHY,
      preset: 'bunko',
      writingMode: 'vertical-rl',
      fontFamily: "'Shippori Mincho', serif",
      fontSize: 17,
      lineHeight: 2.0,
      paperTheme: 'bunkobon',
      fontTheme: 'shippori'
    });
    setCover({ ...DEFAULT_COVER, title: '超富裕層の幸福論', author: '千代目' });
    setBookType('reflow');

    const wealthBook: BookItem = {
      id: 'saved-wealth-1',
      title: '超富裕層の幸福論',
      author: '千代目',
      genre: 'ビジネス・自己啓発',
      description: '総資産100億円超の投資家が明かす、お金と幸福のリアル。',
      bookType: 'reflow',
      readingDirection: 'rtl',
      cover: { ...DEFAULT_COVER, title: '超富裕層の幸福論', author: '千代目' },
      typography: DEFAULT_TYPOGRAPHY,
      chapters: [{ id: 'ch-1', title: '第一章 100億円の資産を築いて見えた景色', content: SAMPLE_TEXT_WEALTH_HAPPINESS }],
      price: 1500,
      salesCount: 15400,
      rating: 4.95,
      pageCount: 220,
      publishedAt: '2026-08-01'
    };

    setMySavedBooks(prev => {
      const filtered = prev.filter(b => b.title !== '超富裕層の幸福論');
      return [wealthBook, ...filtered];
    });

    triggerToast('✨『超富裕層の幸福論 — 生き方と考え方』を縦書きリーダーに完全ロードしました！');
  };

  // 💾【マイページに作品を新規保存】
  const handleSaveCurrentBookToMyPage = () => {
    const existingIdx = mySavedBooks.findIndex(b => b.title === bookTitle);
    const newBook: BookItem = {
      id: existingIdx !== -1 ? mySavedBooks[existingIdx].id : `saved-${Date.now()}`,
      title: bookTitle || '無題の作品',
      author: authorName || '千代目',
      genre: 'ビジネス・実用書',
      description: 'マイページに保存された著者作品',
      bookType,
      readingDirection: 'rtl',
      cover,
      typography,
      chapters: [{ id: 'ch-1', title: bookTitle, content: rawText }],
      price: 1200,
      salesCount: 0,
      rating: 5.0,
      pageCount: Math.ceil(rawText.length / 400),
      publishedAt: new Date().toISOString().split('T')[0]
    };

    if (existingIdx !== -1) {
      setMySavedBooks(prev => prev.map((b, idx) => idx === existingIdx ? newBook : b));
    } else {
      setMySavedBooks(prev => [newBook, ...prev]);
    }

    try { confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } }); } catch (e) {}
    triggerToast(`💾 『${bookTitle}』をマイページの保存ライブラリに追加しました！`);
  };

  // ✏️【マイページから保存作品を選択して編集再開】
  const handleSelectBookForEditing = (book: BookItem) => {
    setBookTitle(book.title);
    setAuthorName(book.author);
    if (book.chapters && book.chapters[0]) {
      setRawText(book.chapters[0].content);
    }
    if (book.cover) setCover(book.cover);
    if (book.typography) setTypography(book.typography);
    if (book.comicPages) setComicPages(book.comicPages);

    setActiveTab('publish');
    triggerToast(`✏️ マイページから『${book.title}』を選択し、編集を再開しました！`);
  };

  // 📖【マイページから保存作品を選択して読む】
  const handleSelectBookForReader = (book: BookItem) => {
    setBookTitle(book.title);
    setAuthorName(book.author);
    if (book.chapters && book.chapters[0]) {
      setRawText(book.chapters[0].content);
    }
    if (book.cover) setCover(book.cover);
    if (book.typography) setTypography(book.typography);
    if (book.comicPages) setComicPages(book.comicPages);

    setActiveTab('reader');
    triggerToast(`📖 『${book.title}』を縦書きリーダーで開きました！`);
  };

  // 🗑️【マイページから削除（編集スタジオ・リーダーと完全連動消去）】
  const handleDeleteBookFromMyPage = (bookId: string) => {
    if (!confirm('この作品をマイページの保存ライブラリから削除しますか？\n（現在編集中のスタジオやリーダーのデータも完全に連動消去されます）')) return;
    
    // 1. ライブラリから削除
    setMySavedBooks(prev => prev.filter(b => b.id !== bookId));

    // 2. 編集スタジオ・縦書きリーダーのデータも完全にクリア＆リセット連動
    setBookTitle('無題の作品');
    setAuthorName('千代目');
    setRawText('');
    
    // 3. LocalStorageドラフトも消去
    try {
      localStorage.removeItem('ebook_platform_draft_v2');
      localStorage.removeItem('ebook_manuscript_history_v1');
    } catch (e) {}

    triggerToast('🗑️ マイページ、原稿スタジオ、リーダーから完全に作品を連動削除いたしました。');
  };

  const handleExportToFile = () => {
    const projectData = {
      version: '2.0',
      savedAt: new Date().toISOString(),
      bookTitle,
      authorName,
      bookType,
      rawText,
      typography,
      tocItems,
      comicPages
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle || 'ebook_project'}_full_backup.json`;
    a.click();
    URL.revokeObjectURL(url);

    triggerToast(`📦 フルプロジェクトファイル『${bookTitle}.json』を出力保存しました！`);
  };

  const handleImportFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.bookTitle) setBookTitle(data.bookTitle);
        if (data.authorName) setAuthorName(data.authorName);
        if (data.rawText) setRawText(data.rawText);
        if (data.typography) setTypography(data.typography);
        if (data.comicPages) setComicPages(data.comicPages);
        if (data.tocItems) setTocItems(data.tocItems);

        triggerToast(`✅ ファイルから『${data.bookTitle || '作品'}』を完全復元読み込みしました！`);
      } catch (err) {
        alert('ファイルの読み込みに失敗しました。正しい.jsonプロジェクトファイルを選択してください。');
      }
    };
    reader.readAsText(file);
  };

  const currentActiveBookItem: BookItem = useMemo(() => {
    return {
      id: 'current-active-book',
      title: bookTitle,
      author: authorName,
      price: 1500,
      rating: 4.9,
      salesCount: 1240,
      description: '執筆中の電子書籍',
      rawText,
      typography,
      cover,
      bookType,
      comicPages,
      tocItems,
      chapters: [{ id: 'ch-1', title: bookTitle, content: rawText }]
    };
  }, [bookTitle, authorName, rawText, typography, cover, bookType, comicPages, tocItems]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#F8FAFC', fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* 🚀 ヘッダーコンポーネント */}
      {!isSharedMode && (
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
      )}

      {/* ⚡ オートセーブ＆同期ステータスバー */}
      {!isSharedMode && (
        <div style={{ backgroundColor: '#0F172A', borderBottom: '1px solid #1E293B', padding: '6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '900', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FileText style={{ width: '13px', height: '13px', color: '#38BDF8' }} />
            編集中: 『{bookTitle}』 (著者: {authorName})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 style={{ width: '12px', height: '12px', color: '#34D399' }} />
          <span style={{ fontSize: '11px', fontWeight: '900', color: '#34D399' }}>
            リアルタイム保護中
          </span>

          <button
            onClick={handleQuickTextDownload}
            style={{
              marginLeft: '10px',
              padding: '3px 10px',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              border: '1px solid #38BDF8',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="現在の原稿テキストをPCに即時保存 (.txt)"
          >
            <Download style={{ width: '12px', height: '12px', color: '#FFF' }} />
            📄 原稿を即時ダウンロード(.txt)
          </button>
        </div>
      </div>
      )}


      {showToast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#0284C7', color: '#FFF', padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{ width: '16px', height: '16px', color: '#FDE047' }} />
          {toastMessage}
        </div>
      )}

      {/* メイン表示タブ切り替え */}
      <main style={{ padding: '20px' }}>
        {activeTab === 'publish' && (
          <PublishStudio
            typography={typography}
            setTypography={setTypography}
            rawText={rawText}
            setRawText={setRawText}
            bookTitle={bookTitle}
            setBookTitle={setBookTitle}
            authorName={authorName}
            setAuthorName={setAuthorName}
            bookType={bookType}
            setBookType={setBookType}
            comicPages={comicPages}
            setComicPages={setComicPages}
            tocItems={tocItems}
            setTocItems={setTocItems}
            onPreviewInReader={() => setActiveTab('reader')}
            onSaveDraftManual={handleSaveCurrentBookToMyPage}
            lastSavedTime={lastSavedTime}
          />
        )}

        {activeTab === 'cover' && (
          <CoverStudio
            cover={cover}
            setCover={setCover}
            bookTitle={bookTitle}
            authorName={authorName}
            onApplyCoverToReader={() => setActiveTab('reader')}
          />
        )}

        {activeTab === 'reader' && (
          <ReaderView
            typography={typography}
            setTypography={setTypography}
            cover={cover}
            bookTitle={bookTitle}
            authorName={authorName}
            rawText={rawText}
            setRawText={setRawText}
            bookType={bookType}
            comicPages={comicPages}
            tocItems={tocItems}
            onBackToStudio={() => setActiveTab('publish')}
            isSharedMode={isSharedMode}
          />
        )}

        {activeTab === 'store' && (
          <StoreAnalytics
            currentBook={currentActiveBookItem}
            onReadBook={handleSelectBookForReader}
          />
        )}

        {activeTab === 'mypage' && (
          <MyPage
            currentBook={currentActiveBookItem}
            mySavedBooks={mySavedBooks}
            onSelectBookForEditing={handleSelectBookForEditing}
            onSelectBookForReader={handleSelectBookForReader}
            onSaveCurrentBookToMyPage={handleSaveCurrentBookToMyPage}
            onDeleteBookFromMyPage={handleDeleteBookFromMyPage}
            onExportToFile={handleExportToFile}
            onImportFromFile={handleImportFromFile}
            onOpenStudio={() => setActiveTab('publish')}
            lastSavedTime={lastSavedTime}
          />
        )}

        {/* 🌗 2画面分割横並びモード (Split View: 左で編集・右で即時縦書きリーダー確認) */}
        {activeTab === 'split' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
            <div style={{ backgroundColor: '#0B132B', borderRadius: '16px', border: '1px solid #1E293B', padding: '16px' }}>
              <div style={{ marginBottom: '10px', fontSize: '13px', fontWeight: '900', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LayoutTemplate style={{ width: '16px', height: '16px' }} />
                ✍️ 左画面：原稿執筆 ＆ リアルタイム編集スタジオ
              </div>
              <PublishStudio
                typography={typography}
                setTypography={setTypography}
                rawText={rawText}
                setRawText={setRawText}
                bookTitle={bookTitle}
                setBookTitle={setBookTitle}
                authorName={authorName}
                setAuthorName={setAuthorName}
                bookType={bookType}
                setBookType={setBookType}
                comicPages={comicPages}
                setComicPages={setComicPages}
                tocItems={tocItems}
                setTocItems={setTocItems}
                onPreviewInReader={() => setActiveTab('reader')}
                onSaveDraftManual={handleSaveCurrentBookToMyPage}
                lastSavedTime={lastSavedTime}
              />
            </div>

            <div style={{ backgroundColor: '#0B132B', borderRadius: '16px', border: '1px solid #1E293B', padding: '16px' }}>
              <div style={{ marginBottom: '10px', fontSize: '13px', fontWeight: '900', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen style={{ width: '16px', height: '16px' }} />
                📖 右画面：リアルタイム縦書き書籍プレビューリーダー
              </div>
              <ReaderView
                typography={typography}
                setTypography={setTypography}
                cover={cover}
                bookTitle={bookTitle}
                authorName={authorName}
                rawText={rawText}
                setRawText={setRawText}
                bookType={bookType}
                comicPages={comicPages}
                tocItems={tocItems}
                onBackToStudio={() => setActiveTab('publish')}
                isSharedMode={isSharedMode}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
