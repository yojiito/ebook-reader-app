import { BookOpen, Sparkles, LayoutTemplate, Palette, ShoppingBag, Wand2, User, Save, Columns } from 'lucide-react';

interface HeaderProps {
  activeTab: 'publish' | 'cover' | 'reader' | 'store' | 'mypage' | 'split';
  setActiveTab: (tab: 'publish' | 'cover' | 'reader' | 'store' | 'mypage' | 'split') => void;
  onQuickPublishDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onQuickPublishDemo }) => {
  return (
    <header 
      style={{
        width: '100%',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '12px 20px',
        marginBottom: '24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '1150px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        {/* Sleek Modern Brand Logo */}
        <div 
          onClick={() => setActiveTab('publish')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer'
          }}
        >
          <div 
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <BookOpen style={{ width: '22px', height: '22px', color: '#FFFFFF' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.5px', margin: 0 }}>
                NovelCraft <span style={{ background: 'linear-gradient(90deg, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
              </h1>
              <span 
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  color: '#A5B4FC',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Sparkles style={{ width: '10px', height: '10px', color: '#F59E0B' }} /> Pro
              </span>
            </div>
            <p style={{ fontSize: '10px', color: '#94A3B8', margin: '1px 0 0 0' }}>文字組 ＆ 目次ドラッグ編集 ＆ 保存管理CMS</p>
          </div>
        </div>

        {/* Refined Sophisticated Pill Navigation Tabs */}
        <nav 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(2, 6, 23, 0.8)',
            padding: '4px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)'
          }}
        >
          <button
            onClick={() => setActiveTab('publish')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: activeTab === 'publish' ? '800' : '600',
              border: activeTab === 'publish' ? '1px solid rgba(255,255,255,0.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === 'publish' ? 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)' : 'transparent',
              color: activeTab === 'publish' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'publish' ? '0 4px 12px rgba(79, 70, 229, 0.4)' : 'none'
            }}
          >
            <LayoutTemplate style={{ width: '14px', height: '14px', color: activeTab === 'publish' ? '#FFF' : '#94A3B8' }} />
            <span>✍️ 原稿入稿 ＆ 目次</span>
          </button>

          {/* 🌗 2画面分割横並びモードボタン */}
          <button
            onClick={() => setActiveTab('split')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: activeTab === 'split' ? '800' : '600',
              border: activeTab === 'split' ? '1px solid rgba(245, 158, 11, 0.5)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === 'split' ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)' : 'transparent',
              color: activeTab === 'split' ? '#FFFFFF' : '#FDE047',
              boxShadow: activeTab === 'split' ? '0 4px 12px rgba(217, 119, 6, 0.4)' : 'none'
            }}
          >
            <Columns style={{ width: '14px', height: '14px', color: activeTab === 'split' ? '#FFF' : '#FDE047' }} />
            <span>🌗 編集＆リーダー 2画面横並び</span>
          </button>

          <button
            onClick={() => setActiveTab('cover')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: activeTab === 'cover' ? '800' : '600',
              border: activeTab === 'cover' ? '1px solid rgba(255,255,255,0.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === 'cover' ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' : 'transparent',
              color: activeTab === 'cover' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'cover' ? '0 4px 12px rgba(236, 72, 153, 0.4)' : 'none'
            }}
          >
            <Palette style={{ width: '14px', height: '14px', color: activeTab === 'cover' ? '#FFF' : '#94A3B8' }} />
            <span>🎨 表紙カバー入稿</span>
          </button>

          <button
            onClick={() => setActiveTab('reader')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: activeTab === 'reader' ? '800' : '600',
              border: activeTab === 'reader' ? '1px solid rgba(255,255,255,0.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === 'reader' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
              color: activeTab === 'reader' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'reader' ? '0 4px 12px rgba(5, 150, 105, 0.4)' : 'none'
            }}
          >
            <BookOpen style={{ width: '14px', height: '14px', color: activeTab === 'reader' ? '#FFF' : '#94A3B8' }} />
            <span>📖 読書リーダー</span>
          </button>

          <button
            onClick={() => setActiveTab('store')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: activeTab === 'store' ? '800' : '600',
              border: activeTab === 'store' ? '1px solid rgba(255,255,255,0.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === 'store' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
              color: activeTab === 'store' ? '#FFFFFF' : '#94A3B8',
              boxShadow: activeTab === 'store' ? '0 4px 12px rgba(2, 132, 199, 0.4)' : 'none'
            }}
          >
            <ShoppingBag style={{ width: '14px', height: '14px', color: activeTab === 'store' ? '#FFF' : '#94A3B8' }} />
            <span>🏪 ストア</span>
          </button>

          <button
            onClick={() => setActiveTab('mypage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: activeTab === 'mypage' ? '800' : '600',
              border: activeTab === 'mypage' ? '1px solid rgba(255,255,255,0.2)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              background: activeTab === 'mypage' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'transparent',
              color: activeTab === 'mypage' ? '#020617' : '#94A3B8',
              boxShadow: activeTab === 'mypage' ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none'
            }}
          >
            <User style={{ width: '14px', height: '14px', color: activeTab === 'mypage' ? '#020617' : '#94A3B8' }} />
            <span>👤 マイページ（保存先）</span>
          </button>
        </nav>

        {/* Demo Publishing Quick Action */}
        {onQuickPublishDemo && (
          <button
            onClick={onQuickPublishDemo}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: '800',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '11px',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Wand2 style={{ width: '13px', height: '13px' }} />
            <span>一発出版デモ</span>
          </button>
        )}
      </div>
    </header>
  );
};
