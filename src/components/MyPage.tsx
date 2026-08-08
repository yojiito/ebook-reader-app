import React, { useState, useRef, useMemo } from 'react';
import { BookItem, ReadingHistoryItem } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  BookOpen, 
  BarChart3,
  Share2,
  Sparkles,
  Check,
  Copy,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  BookMarked,
  Save,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  FolderDown,
  Edit3,
  Eye,
  FileText,
  Clock,
  ListTree,
  FolderOpen,
  Plus,
  Trash2,
  BookmarkPlus,
  History,
  Bookmark
} from 'lucide-react';

interface MyPageProps {
  currentBook: BookItem;
  mySavedBooks: BookItem[];
  onSelectBookForEditing: (book: BookItem) => void;
  onSelectBookForReader: (book: BookItem) => void;
  onSaveCurrentBookToMyPage: () => void;
  onDeleteBookFromMyPage: (bookId: string) => void;
  onExportToFile: () => void;
  onImportFromFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenStudio?: () => void;
  lastSavedTime: string | null;
}

export const MyPage: React.FC<MyPageProps> = ({ 
  currentBook,
  mySavedBooks,
  onSelectBookForEditing,
  onSelectBookForReader,
  onSaveCurrentBookToMyPage,
  onDeleteBookFromMyPage,
  onExportToFile,
  onImportFromFile,
  onOpenStudio,
  lastSavedTime
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 📖【読書履歴 ＆ どこまで読み進めたか進捗トラッカーの取得・手動削除管理】
  const [readingHistoryList, setReadingHistoryList] = useState<ReadingHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ebook_reading_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    return [
      {
        bookTitle: currentBook.title || '庶民から這い上がった超富裕層の幸福論',
        authorName: currentBook.author || '千代目',
        lastReadPageIndex: 2,
        totalSinglePages: 12,
        progressPercent: 45,
        lastReadTime: new Date().toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        isTwoPageSpread: true
      }
    ];
  });

  // 🗑️【読書履歴の個別手動削除】
  const handleDeleteHistoryItem = (title: string) => {
    if (!confirm(`『${title}』の読書履歴を削除しますか？`)) return;
    setReadingHistoryList(prev => {
      const updated = prev.filter(item => item.bookTitle !== title);
      try {
        localStorage.setItem('ebook_reading_history_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // 🧹【読書履歴の全消去】
  const handleClearAllHistory = () => {
    if (!confirm('すべての読書履歴を完全に消去しますか？\n（マイページの保存作品・編集スタジオのデータも一括で連動クリアされます）')) return;
    setReadingHistoryList([]);
    try {
      localStorage.removeItem('ebook_reading_history_v1');
    } catch (e) {}

    // マイ保存作品があればそれらも完全連動消去
    if (mySavedBooks && mySavedBooks.length > 0) {
      mySavedBooks.forEach(b => onDeleteBookFromMyPage(b.id));
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 🚀 マイページ著者ダッシュボードヘッダー */}
      <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900', color: '#FFF', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)' }}>
            {currentBook.author ? currentBook.author.charAt(0) : 'マイ'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#F8FAFC', margin: 0 }}>
                {currentBook.author || 'マイページ（著者ダッシュボード）'}
              </h2>
              <span style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34D399', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                読書履歴 ＆ 保存作品管理
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              「どこまで読み進めたか」の読書履歴トラッカー ＆ 作品一括編集ハブ
            </p>
          </div>
        </div>

        {/* コントロールボタン群 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={onSaveCurrentBookToMyPage}
            style={{
              padding: '10px 18px',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
            }}
          >
            <BookmarkPlus style={{ width: '16px', height: '16px', color: '#FDE047' }} />
            💾 現在の編集原稿をマイページに保存
          </button>

          <button
            onClick={onExportToFile}
            style={{
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
              gap: '6px'
            }}
          >
            <Download style={{ width: '15px', height: '15px' }} />
            PCへ出力 (.json)
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImportFromFile}
            style={{ display: 'none' }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 14px',
              backgroundColor: '#1E293B',
              color: '#A5B4FC',
              border: '1px solid #4338CA',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Upload style={{ width: '15px', height: '15px' }} />
            ファイルから復元
          </button>
        </div>
      </div>

      {/* 📖【新設：どこまで読み進めたか？ 読書履歴 ＆ 進捗トラッカー】 */}
      <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#0F172A', border: '2px solid #0284C7', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '10px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#38BDF8', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History style={{ width: '20px', height: '20px', color: '#FDE047' }} />
              どこまで読み進めたか？ 読書履歴 ＆ 進捗トラッカー
            </h3>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              読み途中の本、停止しているページ、進捗率、閲覧日時をリアルタイム記録しています。
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {readingHistoryList.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                style={{
                  padding: '4px 10px',
                  backgroundColor: '#7F1D1D',
                  color: '#FCA5A5',
                  border: '1px solid #EF4444',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="すべての読書履歴を完全に消去します"
              >
                <Trash2 style={{ width: '13px', height: '13px' }} />
                🧹 履歴を全消去
              </button>
            )}
            <span style={{ fontSize: '11px', fontWeight: '900', color: '#FDE047', backgroundColor: '#854D0E', padding: '3px 10px', borderRadius: '8px' }}>
              🔖 オートしおり連動中
            </span>
          </div>
        </div>

        {readingHistoryList.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#020617', borderRadius: '12px', color: '#64748B', fontSize: '13px' }}>
            読書履歴はありません。リーダーで作品を閲覧すると自動記録されます。
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {readingHistoryList.map((item, idx) => {
              const displayPageLabel = item.isTwoPageSpread 
                ? `見開き P.${(item.lastReadPageIndex * 2) + 1} - ${(item.lastReadPageIndex * 2) + 2}`
                : `P.${item.lastReadPageIndex + 1}`;

              return (
                <div 
                  key={`history-${idx}`}
                  style={{
                    padding: '18px',
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: '900', color: '#FFF', margin: '0 0 4px 0' }}>
                        『{item.bookTitle}』
                      </h4>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                        著者: {item.authorName}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#CBD5E1', backgroundColor: '#1E293B', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                      {item.lastReadTime}
                    </span>
                  </div>

                  {/* プログレスバー（どこまで読んだか） */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '900', marginBottom: '4px' }}>
                      <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bookmark style={{ width: '13px', height: '13px', color: '#FDE047' }} />
                        停止中: {displayPageLabel}
                      </span>
                      <span style={{ color: '#38BDF8' }}>
                        進捗率: {item.progressPercent}%
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '8px', backgroundColor: '#1E293B', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${item.progressPercent}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #38BDF8, #4F46E5)', 
                          borderRadius: '4px',
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>
                  </div>

                  {/* 止まったページからワンタップ再開 ＆ 手動個別削除 */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const targetBook = mySavedBooks.find(b => b.title === item.bookTitle) || currentBook;
                        onSelectBookForReader(targetBook);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#4F46E5',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 10px rgba(79, 70, 229, 0.4)'
                      }}
                    >
                      <BookOpen style={{ width: '15px', height: '15px' }} />
                      止まった {displayPageLabel} から再開
                    </button>

                    <button
                      onClick={() => handleDeleteHistoryItem(item.bookTitle)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#1E293B',
                        color: '#FCA5A5',
                        border: '1px solid #7F1D1D',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="この読書履歴を削除"
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📚【マイページ保存作品ライブラリ（マイ保存作品一覧＆編集再開カード）】 */}
      <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#0B132B', border: '2px solid #4F46E5', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1E293B', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#F8FAFC', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookMarked style={{ width: '20px', height: '20px', color: '#F59E0B' }} />
              マイページ保存作品ライブラリ (全 {mySavedBooks.length} 冊)
            </h3>
            <p style={{ fontSize: '11px', color: '#94A3B8', margin: '4px 0 0 0' }}>
              マイページに保存された作品は、いつでも「編集を再開」ボタンで続きの執筆・装丁ができます。
            </p>
          </div>

          <button
            onClick={onOpenStudio}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4F46E5',
              color: '#FFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            新規原稿を作成
          </button>
        </div>

        {mySavedBooks.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
            （まだマイページに保存された作品がありません）<br />
            上部の「💾 現在の編集原稿をマイページに保存」ボタンを押すと、いつでもここに保存できます。
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {mySavedBooks.map((book) => {
              const charLen = book.chapters?.[0]?.content?.length || 0;
              const isCurrent = book.title === currentBook.title;

              return (
                <div
                  key={book.id}
                  style={{
                    padding: '16px 18px',
                    backgroundColor: isCurrent ? '#0F172A' : '#020617',
                    border: isCurrent ? '2px solid #F59E0B' : '1px solid #1E293B',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    boxShadow: isCurrent ? '0 8px 20px rgba(245,158,11,0.2)' : 'none',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '900', color: isCurrent ? '#FDE047' : '#38BDF8', backgroundColor: isCurrent ? '#854D0E' : '#1E293B', padding: '2px 8px', borderRadius: '6px' }}>
                        {isCurrent ? '⚡ 編集中の保存作品' : '💾 マイ保存作品'}
                      </span>
                      <button
                        onClick={() => onDeleteBookFromMyPage(book.id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '2px' }}
                        title="マイページから削除"
                      >
                        <Trash2 style={{ width: '15px', height: '15px' }} />
                      </button>
                    </div>

                    <h4 style={{ fontSize: '15px', fontWeight: '900', color: '#FFFFFF', margin: '4px 0' }}>
                      『{book.title}』
                    </h4>
                    <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                      著者: {book.author} ｜ 文字数: {charLen.toLocaleString()} 字
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #1E293B', paddingTop: '10px' }}>
                    <button
                      onClick={() => onSelectBookForEditing(book)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        backgroundColor: '#0284C7',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      <Edit3 style={{ width: '14px', height: '14px', color: '#FDE047' }} />
                      編集を再開
                    </button>

                    <button
                      onClick={() => onSelectBookForReader(book)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#334155',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      読む
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 📊 収益 ＆ 著者アナリティクス */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        <div className="glass-panel" style={{ padding: '18px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' }}>今月の推計印税収益</span>
            <DollarSign style={{ width: '18px', height: '18px', color: '#34D399' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#34D399' }}>
            ¥ 1,248,500
          </div>
          <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
            <TrendingUp style={{ width: '12px', height: '12px' }} /> 前月比 +24.8%
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '18px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' }}>累計販売冊数</span>
            <BookOpen style={{ width: '18px', height: '18px', color: '#38BDF8' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#F8FAFC' }}>
            15,400 <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94A3B8' }}>冊</span>
          </div>
          <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
            ★ AmazonKindle部門1位獲得
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '18px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' }}>平均読了率</span>
            <BarChart3 style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: '#F59E0B' }}>
            89.4 <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#94A3B8' }}>%</span>
          </div>
          <span style={{ fontSize: '11px', color: '#FDE047', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
            非常に高いエンゲージメント
          </span>
        </div>

      </div>

    </div>
  );
};
