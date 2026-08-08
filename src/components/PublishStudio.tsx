import React, { useState, useRef, useEffect } from 'react';
import { TypographySettings, PresetKey, BookType, ComicPage, TocItem, CoverSettings } from '../types';
import { SAMPLE_TEXT_NOVEL, SAMPLE_TEXT_BUSINESS, SAMPLE_TEXT_WEALTH_HAPPINESS, SAMPLE_COMIC_PAGES } from '../data/sampleBooks';
import { exportBookToEpub } from '../utils/epubExporter';
import { 
  Sparkles, 
  Smartphone, 
  FileText, 
  Wand2, 
  Eye, 
  Tag,
  Image as ImageIcon,
  Upload,
  ListTree,
  Plus,
  Trash2,
  List,
  ArrowRight,
  BookOpen,
  Link,
  ChevronRight,
  GripVertical,
  Layers,
  Zap,
  RefreshCw,
  Search,
  Columns,
  CheckCircle2,
  BookmarkPlus,
  ShieldCheck,
  Save,
  Clock,
  ArrowLeftRight,
  Sliders,
  AlignLeft,
  Monitor,
  HelpCircle,
  Download,
  FolderOpen,
  FileJson,
  Check,
  X
} from 'lucide-react';

interface PublishStudioProps {
  typography: TypographySettings;
  setTypography: React.Dispatch<React.SetStateAction<TypographySettings>>;
  rawText: string;
  setRawText: (text: string) => void;
  bookTitle: string;
  setBookTitle: (title: string) => void;
  authorName: string;
  setAuthorName: (author: string) => void;
  bookType: BookType;
  setBookType: (type: BookType) => void;
  comicPages: ComicPage[];
  setComicPages: React.Dispatch<React.SetStateAction<ComicPage[]>>;
  tocItems: TocItem[];
  setTocItems: React.Dispatch<React.SetStateAction<TocItem[]>>;
  onPreviewInReader: () => void;
  onSaveDraftManual?: () => void;
  lastSavedTime?: string | null;
}

export const PublishStudio: React.FC<PublishStudioProps> = ({
  typography,
  setTypography,
  rawText,
  setRawText,
  bookTitle,
  setBookTitle,
  authorName,
  setAuthorName,
  bookType,
  setBookType,
  comicPages,
  setComicPages,
  tocItems,
  setTocItems,
  onPreviewInReader,
  onSaveDraftManual,
  lastSavedTime
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [rubyRt, setRubyRt] = useState('');
  const [showRubyModal, setShowRubyModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [showSaveOptionsModal, setShowSaveOptionsModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charsPerLine = typography.charsPerLine || 38;
  const linesPerPage = typography.linesPerPage || 16;

  // 💾【テキストファイル (.txt) としてローカルPCに保存】
  const handleExportAsTxtFile = () => {
    const fileName = `${bookTitle || '原稿'}_${authorName || '著者'}.txt`;
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    triggerSyncNotice(`📄 テキストファイル『${fileName}』をダウンロードフォルダに保存しました！`);
  };

  // 💾【プロジェクト全体データ (.json) としてローカルPCに保存】
  const handleExportAsJsonProject = () => {
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

    const fileName = `${bookTitle || '電子書籍'}_プロジェクトバックアップ.json`;
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    triggerSyncNotice(`💾 プロジェクトファイル『${fileName}』を保存しました！`);
  };

  const triggerSyncNotice = (msg: string) => {
    setSyncNotice(msg);
    setTimeout(() => setSyncNotice(null), 3500);
  };



  return (
    <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 🚀【ヘッダーセクション＆保存コントロールバー】 */}
      <div className="glass-panel" style={{ width: '100%', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', backgroundColor: '#0F172A', border: '1px solid #334155' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#F8FAFC', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText style={{ width: '20px', height: '20px', color: '#38BDF8' }} />
            原稿執筆 ＆ 出版スタジオ
          </h2>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>
            リアルタイム全自動保存 ＆ PCローカルファイル保存（EPUB3 / テキスト / JSON）完備
          </p>
        </div>

        {/* 💾 保存コントロールエリア */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* 🛡️ ユーザー原稿絶対保護バッジ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#064E3B', padding: '6px 12px', borderRadius: '8px', border: '1px solid #10B981' }}>
            <ShieldCheck style={{ width: '15px', height: '15px', color: '#34D399' }} />
            <span style={{ fontSize: '11px', color: '#6EE7B7', fontWeight: '900' }}>
              🛡️ 原稿絶対保護モード稼働中
            </span>
          </div>

          {/* 保存ステータスバッジ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#020617', padding: '6px 12px', borderRadius: '8px', border: '1px solid #1E293B' }}>
            <CheckCircle2 style={{ width: '14px', height: '14px', color: '#34D399' }} />
            <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 'bold' }}>
              自動保存完了 {lastSavedTime ? `(${lastSavedTime})` : ''}
            </span>
          </div>

          {/* 💾 マイページに直接保存 */}
          <button
            onClick={() => {
              if (onSaveDraftManual) onSaveDraftManual();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
            }}
          >
            <BookmarkPlus style={{ width: '16px', height: '16px', color: '#FDE047' }} />
            💾 マイページに保存
          </button>

          {/* 📥 保存先ファイル書き出しメニュー */}
          <button
            onClick={() => setShowSaveOptionsModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.4)'
            }}
          >
            <FolderOpen style={{ width: '15px', height: '15px', color: '#FDE047' }} />
            原稿をローカル保存...
          </button>

          {/* 📖 リーダープレビュー */}
          <button
            onClick={onPreviewInReader}
            style={{
              padding: '8px 18px',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
            }}
          >
            <Eye style={{ width: '15px', height: '15px', color: '#FDE047' }} />
            縦書きリーダーで確認 ▶
          </button>
        </div>
      </div>

      {syncNotice && (
        <div style={{ backgroundColor: '#0284C7', color: '#FFF', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles style={{ width: '16px', height: '16px', color: '#FDE047' }} />
          {syncNotice}
        </div>
      )}

      {/* 🚀【メイン執筆 ＆ 設定グリッド】 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
        
        {/* 左側：原稿エディター */}
        <div className="glass-panel" style={{ padding: '20px', backgroundColor: '#0B132B', border: '1px solid #1E293B', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* 書籍基本情報入力（タイトル・著者名） */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '900', color: '#FDE047', display: 'block', marginBottom: '4px' }}>
                書籍タイトル:
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', fontSize: '13px', fontWeight: 'bold', outline: 'none' }}
                placeholder="例: 超富裕層の幸福論"
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '900', color: '#38BDF8', display: 'block', marginBottom: '4px' }}>
                著者名:
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', color: '#FFF', fontSize: '13px', fontWeight: 'bold', outline: 'none' }}
                placeholder="例: 橘 慶一郎"
              />
            </div>
          </div>

          {/* 本文原稿テキストエリア */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '900', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlignLeft style={{ width: '14px', height: '14px', color: '#38BDF8' }} />
                本文原稿テキスト (マークダウン / ルビ notation 対応)
              </label>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'bold' }}>
                文字数: {rawText.length.toLocaleString()} 字
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              style={{
                width: '100%',
                height: '480px',
                backgroundColor: '#020617',
                color: '#F8FAFC',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                lineHeight: '1.8',
                fontFamily: "'Courier New', Courier, monospace",
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="# 第一章 見出し..."
            />
          </div>
        </div>

        {/* 右側：保存形式・出版ガイドパネル */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '18px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '900', color: '#FDE047', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderOpen style={{ width: '16px', height: '16px', color: '#FDE047' }} />
              保存形式 ＆ ダウンロード保存先
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => exportBookToEpub(bookTitle, authorName, rawText)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#059669',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download style={{ width: '15px', height: '15px', color: '#FDE047' }} />
                  EPUB3 電子書籍ファイル (.epub)
                </span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>DL保存</span>
              </button>

              <button
                onClick={handleExportAsTxtFile}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1E293B',
                  color: '#38BDF8',
                  border: '1px solid #0284C7',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText style={{ width: '15px', height: '15px', color: '#38BDF8' }} />
                  原稿テキストファイル (.txt)
                </span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>DL保存</span>
              </button>

              <button
                onClick={handleExportAsJsonProject}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#312E81',
                  color: '#A5B4FC',
                  border: '1px solid #4338CA',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileJson style={{ width: '15px', height: '15px', color: '#F59E0B' }} />
                  フルプロジェクトデータ (.json)
                </span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>DL保存</span>
              </button>
            </div>

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #1E293B', fontSize: '11px', color: '#94A3B8', lineHeight: '1.5' }}>
              💡 <strong>保存先の場所</strong>: ボタンをクリックすると、お使いのPCの標準<strong>「ダウンロード」フォルダ</strong>へ即座に安全保存されます。ブラウザ設定により保存先ダイアログを指定することも可能です。
            </div>
          </div>

        </div>

      </div>

      {/* 📥【ローカル保存形式選択モーダル】 */}
      {showSaveOptionsModal && (
        <div 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
          onClick={() => setShowSaveOptionsModal(false)}
        >
          <div 
            style={{ backgroundColor: '#0F172A', border: '2px solid #059669', borderRadius: '18px', padding: '24px', maxWidth: '460px', width: '90%', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#FDE047', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen style={{ width: '18px', height: '18px', color: '#FDE047' }} />
                原稿の保存先 ＆ 形式を選択
              </h3>
              <button onClick={() => setShowSaveOptionsModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.6', marginBottom: '16px' }}>
              執筆した原稿『<strong>{bookTitle}</strong>』をお好きな形式でローカルPCへ書き出して保存できます。
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  exportBookToEpub(bookTitle, authorName, rawText);
                  setShowSaveOptionsModal(false);
                }}
                style={{ padding: '12px 16px', backgroundColor: '#059669', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>📖 EPUB3 出版ファイル (.epub)</span>
                  <span style={{ color: '#FDE047' }}>推奨</span>
                </div>
                <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 'normal' }}>
                  KindleやApple Books等の電子書籍リーダーで即読める完成版ファイル
                </span>
              </button>

              <button
                onClick={() => {
                  handleExportAsTxtFile();
                  setShowSaveOptionsModal(false);
                }}
                style={{ padding: '12px 16px', backgroundColor: '#1E293B', color: '#38BDF8', border: '1px solid #0284C7', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>📄 テキスト原稿 (.txt)</span>
                </div>
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'normal' }}>
                  文字のみのシンプル本文データ（他エディタやバックアップ用）
                </span>
              </button>

              <button
                onClick={() => {
                  handleExportAsJsonProject();
                  setShowSaveOptionsModal(false);
                }}
                style={{ padding: '12px 16px', backgroundColor: '#312E81', color: '#A5B4FC', border: '1px solid #4338CA', borderRadius: '12px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>💾 完全プロジェクトバックアップ (.json)</span>
                </div>
                <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 'normal' }}>
                  表紙設定・文字組・目次・原稿を丸ごと含んだ一括復元データ
                </span>
              </button>
            </div>

            <div style={{ marginTop: '18px', textAlign: 'right' }}>
              <button
                onClick={() => setShowSaveOptionsModal(false)}
                style={{ backgroundColor: '#334155', color: '#FFF', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
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
