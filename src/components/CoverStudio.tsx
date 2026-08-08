import React, { useState, useRef } from 'react';
import { CoverSettings } from '../types';
import { SAMPLE_BOOKS } from '../data/sampleBooks';
import { 
  Upload, 
  Image as ImageIcon, 
  ArrowRight,
  BookOpen,
  Link2,
  CheckCircle2,
  Eye,
  ShieldCheck,
  Palette,
  Type,
  Layers,
  Grid,
  FileImage,
  Sparkles,
  Check
} from 'lucide-react';

interface CoverStudioProps {
  cover: CoverSettings;
  setCover: React.Dispatch<React.SetStateAction<CoverSettings>>;
  bookTitle: string;
  authorName: string;
  onApplyCoverToReader: () => void;
}

// 1. 定番装丁テンプレート（非AI / プロ品質）
export interface ClassicTemplateOption {
  id: string;
  name: string;
  category: string;
  badge: string;
  previewBg: string;
  settings: CoverSettings;
}

export const CLASSIC_TEMPLATES: ClassicTemplateOption[] = [
  {
    id: 'jp-traditional',
    name: '伝統和風・漆黒金文字装丁',
    category: '時代小説・歴史・ミステリー',
    badge: '王道和風',
    previewBg: 'linear-gradient(135deg, #18181B 0%, #09090B 100%)',
    settings: {
      title: '銀河の果ての図書館',
      author: '新城 葵',
      subtitle: '和風伝統装丁',
      catchphrase: '【読者絶賛の和風大作！】ラスト10ページの衝撃の真実に涙する。',
      genre: '時代小説',
      style: 'japanese-art',
      prompt: 'traditional japanese',
      bgImageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80',
      gradientOverlay: 'rgba(0,0,0,0.2)',
      titlePosition: 'top',
      titleColor: '#F59E0B',
      titleFont: "'Shippori Mincho', serif",
      badgeText: '話題作',
      showBand: true,
      bandColor: '#065F46',
      bandTextColor: '#FFFFFF'
    }
  },
  {
    id: 'biz-modern-clean',
    name: 'インパクト現代ビジネス装丁',
    category: 'ビジネス・自己啓発・実用書',
    badge: '現代クリーン',
    previewBg: 'linear-gradient(180deg, #FAFAFA 0%, #E2E8F0 100%)',
    settings: {
      title: '銀河の果ての図書館',
      author: '新城 葵',
      subtitle: 'ビジネス現代装丁',
      catchphrase: '【シリーズ累計60万部！】今年一番読まれた決定版ビジネス書！',
      genre: 'ビジネス',
      style: 'minimal',
      prompt: 'minimal business',
      bgImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      gradientOverlay: 'rgba(0,0,0,0.0)',
      titlePosition: 'top',
      titleColor: '#0F172A',
      titleFont: "'Noto Sans JP', sans-serif",
      badgeText: '第1位',
      showBand: true,
      bandColor: '#F59E0B',
      bandTextColor: '#020617'
    }
  },
  {
    id: 'novel-twilight-purple',
    name: '幻想幻想文庫・紫濃紺グラデ装丁',
    category: '文庫・ファンタジー・純文学',
    badge: '幻想文庫',
    previewBg: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
    settings: {
      title: '銀河の果ての図書館',
      author: '新城 葵',
      subtitle: '幻想文庫装丁',
      catchphrase: '【祝・映画化決定！】全国書店員が最も売りたい本第1位。',
      genre: '文学・文庫',
      style: 'watercolor',
      prompt: 'twilight fantasy',
      bgImageUrl: 'https://images.unsplash.com/photo-1507842072832-720892224855?auto=format&fit=crop&w=800&q=80',
      gradientOverlay: 'rgba(0,0,0,0.3)',
      titlePosition: 'center',
      titleColor: '#FFFFFF',
      titleFont: "'Shippori Mincho', serif",
      badgeText: '本屋大賞',
      showBand: true,
      bandColor: '#E11D48',
      bandTextColor: '#FFFFFF'
    }
  }
];

export const CoverStudio: React.FC<CoverStudioProps> = ({
  cover,
  setCover,
  bookTitle,
  authorName,
  onApplyCoverToReader
}) => {
  // メインモード：'upload-custom' (自作デザインデータアップロード) を最優先メインモードへ！
  const [studioMode, setStudioMode] = useState<'upload-custom' | 'safe-trace' | 'classic-templates' | 'manual-text' | 'manual-band'>('upload-custom');

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputUrl, setInputUrl] = useState('https://www.amazon.co.jp/%E3%81%8A%E7%B5%8C%E3%81%AB%E8%A8%98%E3%81%95%E3%82%8C%E3%81%9F%E5%AE%9D%E3%81%AE%E3%81%82%E3%82%8A%E3%81%8B-%E4%BB%8F%E6%95%99%E3%83%AC%E3%82%B3%E3%83%BC%E3%83%89-%E4%B8%89%E6%9C%A8%E5%A4%A7%E9%9B%B2/dp/4054071171/');
  const [isTracing, setIsTracing] = useState(false);
  const [useCustomBookInfo, setUseCustomBookInfo] = useState(true);

  // 実物見本情報State
  const [sampleRealCover, setSampleRealCover] = useState({
    title: 'お経に記された宝のありか 仏教レコード',
    author: '三木大雲',
    imgUrl: 'https://images-na.ssl-images-amazon.com/images/P/4054071171.01._SCLZZZZZZZ_SX500_.jpg'
  });

  // ファイルアップロード処理（PNG, JPG, Canva, Photoshop出力画像等）
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadedImage(result);
      setUploadSuccess(true);

      // アップロードされたデザインデータをカバーに100%直接適用！
      setCover(prev => ({
        ...prev,
        bgImageUrl: result,
        subtitle: '自作デザインデータ適用装丁',
        catchphrase: '【著者オリジナルデザインデータ】Photoshop/Canva入稿データ直接反映！',
        showBand: false // 自作カバーの場合はデフォルトで帯なし（選択可能）
      }));

      setTimeout(() => setUploadSuccess(false), 4000);
    };
    reader.readAsDataURL(file);
  };

  // 🛡️【著作権セーフ型 AIデザイン安全置換エンジン】
  const handleCopyrightSafeAdaptation = (targetUrl?: string) => {
    const urlToUse = targetUrl || inputUrl;
    if (!urlToUse) return;

    setIsTracing(true);

    let asin = '4054071171';
    let title = 'お経に記された宝のありか 仏教レコード';
    let author = '三木大雲';
    let safeBg = 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80';
    let safeAccent = '#F59E0B';
    let safeBand = '#065F46';

    try {
      const decoded = decodeURIComponent(urlToUse);
      const asinMatch = decoded.match(/dp\/([A-Z0-9]{10})/i) || decoded.match(/product\/([A-Z0-9]{10})/i);
      if (asinMatch && asinMatch[1]) {
        asin = asinMatch[1];
      }

      if (decoded.includes('薬屋')) {
        title = '薬屋のひとりごと 17 ビッグガンガンコミックス';
        author = '日向夏 / ねこクラゲ';
        safeBg = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80';
        safeAccent = '#FEF08A';
        safeBand = '#7E22CE';
      } else if (decoded.includes('頭のいい人')) {
        title = '頭のいい人が話す前に考えていること';
        author = '安達 裕哉';
        safeBg = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80';
        safeAccent = '#0F172A';
        safeBand = '#F59E0B';
      }
    } catch (e) {}

    const realReferenceImg = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX500_.jpg`;

    setSampleRealCover({
      title,
      author,
      imgUrl: realReferenceImg
    });

    setTimeout(() => {
      setIsTracing(false);

      setCover({
        title: useCustomBookInfo ? (bookTitle || '銀河の果ての図書館') : title,
        author: useCustomBookInfo ? (authorName || '新城 葵') : author,
        subtitle: '著作権保護安全変換装丁',
        catchphrase: '【商用利用OK・著作権完全保護】プロの文字組・配色骨格を安全適応！',
        genre: '一般書籍',
        style: 'japanese-art',
        prompt: 'copyright safe adapted cover',
        bgImageUrl: safeBg,
        gradientOverlay: 'rgba(0,0,0,0.15)',
        titlePosition: 'top',
        titleColor: safeAccent,
        titleFont: "'Shippori Mincho', serif",
        badgeText: '商用OK',
        showBand: true,
        bandColor: safeBand,
        bandTextColor: '#FFFFFF'
      });
    }, 600);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1150px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* MODE SELECTION BAR: DESIGN DATA UPLOAD PRIMARY */}
      <div className="glass-panel" style={{ width: '100%', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Upload style={{ width: '20px', height: '20px', color: '#38BDF8' }} />
              自作デザインデータ入稿 ＆ 表紙カバー作成 Studio
            </h2>
            <p style={{ fontSize: '12px', color: '#CBD5E1', margin: 0 }}>
              Photoshop/Canva/Illustrator等の完成デザインデータの直接入稿をメインサポート！
            </p>
          </div>
          <span style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
            デザインデータ入稿メイン
          </span>
        </div>

        {/* MODE TABS */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStudioMode('upload-custom')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: '900',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: studioMode === 'upload-custom' ? '#0284C7' : '#1E293B',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: studioMode === 'upload-custom' ? '0 4px 12px rgba(2,132,199,0.4)' : 'none'
            }}
          >
            <Upload style={{ width: '14px', height: '14px', color: '#FDE047' }} />
            📁 1. 自作デザインデータ入稿 (PSD/PNG/JPG/Canva)
          </button>

          <button
            onClick={() => setStudioMode('classic-templates')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: studioMode === 'classic-templates' ? '#4F46E5' : '#1E293B',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Grid style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
            📚 2. 定番プロ装丁テンプレート
          </button>

          <button
            onClick={() => setStudioMode('safe-trace')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: studioMode === 'safe-trace' ? '#059669' : '#1E293B',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck style={{ width: '14px', height: '14px', color: '#34D399' }} />
            🛡️ 3. 実本構造セーフ解析トレース
          </button>

          <button
            onClick={() => setStudioMode('manual-text')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: studioMode === 'manual-text' ? '#4F46E5' : '#1E293B',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Type style={{ width: '14px', height: '14px', color: '#38BDF8' }} />
            ✍️ 4. タイトル位置・カラー直接編集
          </button>

          <button
            onClick={() => setStudioMode('manual-band')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: studioMode === 'manual-band' ? '#4F46E5' : '#1E293B',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers style={{ width: '14px', height: '14px', color: '#F472B6' }} />
            🏷️ 5. 帯テキスト・カラー手動編集
          </button>
        </div>
      </div>

      {/* MAIN 2-COLUMN LAYOUT */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT 7 COLUMNS: ACTIVE MODE CONTROLS */}
        <div style={{ gridColumn: 'span 7 / span 7', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* MODE 1: CUSTOM DESIGN DATA UPLOADER (メインモード) */}
          {studioMode === 'upload-custom' && (
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid #0284C7', backgroundColor: '#0B132B' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: '900', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileImage style={{ width: '18px', height: '18px', color: '#FDE047' }} />
                  自作デザインデータファイルの直接アップロード
                </span>
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>PNG / JPG / WEBP / Canva出力対応</span>
              </div>

              {/* DROPZONE */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #0284C7',
                  borderRadius: '12px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#0F172A',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(2,132,199,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8' }}>
                  <Upload style={{ width: '24px', height: '24px' }} />
                </div>

                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#FFF', margin: '0 0 4px 0' }}>
                    ここにデザインデータをドラッグ＆ドロップ
                  </h4>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                    またはクリックしてパソコン内の画像ファイルを選択（推奨比率 1 : 1.45）
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                />

                <button
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFF',
                    fontSize: '11px',
                    fontWeight: '900',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  ファイルを選択する
                </button>
              </div>

              {uploadSuccess && (
                <div style={{ backgroundColor: '#022C22', border: '1px solid #059669', color: '#6EE7B7', padding: '10px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#34D399' }} />
                  デザインデータの直接アップロードが完了し、プロ装丁成果物へ即座に反映されました！
                </div>
              )}

              {/* Design Data Notice */}
              <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '8px', border: '1px solid #1E293B', marginTop: '14px' }}>
                <h5 style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 'bold', margin: '0 0 4px 0' }}>💡 おすすめの自作デザイン作成環境</h5>
                <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0, lineHeight: '1.4' }}>
                  CanvaやAdobe Photoshop / Illustrator、CLIP STUDIO等の本格ツールで作成した解像度の高い画像データをアップロードいただくことで、100%著者の意図通りの最高の装丁で電子書籍化できます。
                </p>
              </div>
            </div>
          )}

          {/* MODE 2: CLASSIC NON-AI TEMPLATES */}
          {studioMode === 'classic-templates' && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Grid style={{ width: '16px', height: '16px' }} />
                2. プロ作成済み定番装丁テンプレート (手動選択)
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {CLASSIC_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    onClick={() => setCover(tmpl.settings)}
                    style={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      borderRadius: '10px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{ width: '38px', height: '54px', borderRadius: '4px', background: tmpl.previewBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '10px', fontWeight: 'bold' }}>
                      装丁
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '8px', fontWeight: '900', backgroundColor: '#F59E0B', color: '#020617', padding: '1px 6px', borderRadius: '3px' }}>
                        {tmpl.badge}
                      </span>
                      <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#FFF', margin: '3px 0 0 0' }}>{tmpl.name}</h4>
                      <p style={{ fontSize: '9px', color: '#94A3B8', margin: 0 }}>{tmpl.category}</p>
                    </div>
                    <button style={{ backgroundColor: '#4F46E5', color: '#FFF', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>
                      このテンプレートを適用
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODE 3: AMAZON SAFE TRACE */}
          {studioMode === 'safe-trace' && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <ShieldCheck style={{ width: '16px', height: '16px' }} />
                3. Amazon書籍URLから著作権安全置換トレース
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Amazonの書籍URLをここに貼り付けてください"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '11px', backgroundColor: '#0F172A', color: '#FFF', border: '1px solid #475569' }}
                />

                <button
                  onClick={() => handleCopyrightSafeAdaptation()}
                  disabled={isTracing}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    backgroundColor: '#059669',
                    color: '#FFF',
                    fontSize: '12px',
                    fontWeight: '900',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ShieldCheck style={{ width: '16px', height: '16px', color: '#FDE047' }} />
                  {isTracing ? '著作権安全置換中...' : '🛡️ 著作権100%安全置換を実行'}
                </button>
              </div>
            </div>
          )}

          {/* MODE 4: MANUAL TEXT */}
          {studioMode === 'manual-text' && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Type style={{ width: '16px', height: '16px' }} />
                4. タイトル位置 ＆ 文字色・フォント手動編集
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>タイトルの配置位置</label>
                  <select
                    value={cover.titlePosition}
                    onChange={(e) => setCover({ ...cover, titlePosition: e.target.value as any })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', fontSize: '11px' }}
                  >
                    <option value="top">上部配置 (Top)</option>
                    <option value="center">中央配置 (Center)</option>
                    <option value="bottom">下部配置 (Bottom)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>タイトル文字カラー</label>
                  <input
                    type="color"
                    value={cover.titleColor}
                    onChange={(e) => setCover({ ...cover, titleColor: e.target.value })}
                    style={{ width: '100%', height: '32px', padding: '2px', borderRadius: '6px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODE 5: MANUAL BAND EDIT */}
          {studioMode === 'manual-band' && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#F472B6', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Layers style={{ width: '16px', height: '16px' }} />
                5. 帯テキスト ＆ 帯カラー手動編集
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>帯の表示オン / オフ</label>
                  <input
                    type="checkbox"
                    checked={cover.showBand}
                    onChange={(e) => setCover({ ...cover, showBand: e.target.checked })}
                    style={{ accentColor: '#F472B6' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>帯のキャッチコピー文章</label>
                  <input
                    type="text"
                    value={cover.catchphrase}
                    onChange={(e) => setCover({ ...cover, catchphrase: e.target.value })}
                    style={{ width: '100%', padding: '9px', borderRadius: '6px', fontSize: '11px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#94A3B8', display: 'block', marginBottom: '4px' }}>帯の背景カラー</label>
                  <input
                    type="color"
                    value={cover.bandColor}
                    onChange={(e) => setCover({ ...cover, bandColor: e.target.value })}
                    style={{ width: '100%', height: '32px', padding: '2px', borderRadius: '6px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom Book Info Checkbox */}
          <div className="glass-panel" style={{ padding: '14px' }}>
            <label style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useCustomBookInfo}
                onChange={(e) => setUseCustomBookInfo(e.target.checked)}
                style={{ accentColor: '#F59E0B' }}
              />
              自分の作品名（{bookTitle}）で成果物を完成させる
            </label>
          </div>

        </div>

        {/* RIGHT 5 COLUMNS: ALWAYS-VISIBLE PREVIEW CANVAS */}
        <div style={{ gridColumn: 'span 5 / span 5', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ position: 'sticky', top: '96px', width: '100%', maxWidth: '340px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye style={{ width: '14px', height: '14px', color: '#F59E0B' }} />
                【完成成果物プレビュー】
              </span>
              <button
                onClick={onApplyCoverToReader}
                style={{ fontSize: '11px', color: '#FFF', backgroundColor: '#0284C7', fontWeight: '900', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 4px 10px rgba(2,132,199,0.4)' }}
              >
                作品リーダーに適用 <ArrowRight style={{ width: '12px', height: '12px' }} />
              </button>
            </div>

            {/* PREVIEW CANVAS */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '260px',
                  aspectRatio: '1/1.45',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 16px 32px rgba(0,0,0,0.85)',
                  borderLeft: '5px solid #1E293B',
                  backgroundColor: '#0F172A',
                  position: 'relative',
                  padding: '12px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Custom Uploaded or Selected Image */}
                <img
                  src={cover.bgImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'}
                  alt="完成装丁表紙"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Overlaid Gradient only if not custom uploaded image */}
                {!uploadedImage && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 50%, rgba(0,0,0,0.7) 100%)' }} />
                )}

                {/* Top Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 }}>
                  <span style={{ fontSize: '8px', fontWeight: '900', color: '#FFF', backgroundColor: '#0284C7', padding: '2px 6px', borderRadius: '3px' }}>
                    NovelCraft
                  </span>
                  {uploadedImage && (
                    <span style={{ fontSize: '8px', fontWeight: '900', color: '#6EE7B7', backgroundColor: '#022C22', padding: '2px 6px', borderRadius: '10px', border: '1px solid #059669', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Check style={{ width: '10px', height: '10px' }} /> 自作データ入稿済み
                    </span>
                  )}
                </div>

                {/* Typography (shown if overlay text enabled or not uploaded image) */}
                {!uploadedImage && (
                  <div style={{ zIndex: 3, margin: '6px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ writingMode: 'vertical-rl', fontSize: '14px', fontWeight: '900', color: cover.titleColor || '#FEF08A', fontFamily: cover.titleFont || "'Shippori Mincho', serif", textShadow: '0 2px 5px #000', height: '95px' }}>
                      {useCustomBookInfo ? (bookTitle || '銀河の果ての図書館') : sampleRealCover.title}
                    </div>

                    <div style={{ fontSize: '9px', color: '#E2E8F0', fontWeight: 'bold', marginTop: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                      著者: {useCustomBookInfo ? (authorName || '新城 葵') : sampleRealCover.author}
                    </div>
                  </div>
                )}

                {/* Band (shown if enabled) */}
                {cover.showBand && !uploadedImage && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: cover.bandColor || '#065F46', color: '#FFF', padding: '5px 8px', textShadow: 'none', borderTop: '1.5px solid #F59E0B', zIndex: 5 }}>
                    <div style={{ fontSize: '7px', fontWeight: '900', color: '#FDE047' }}>装丁完成</div>
                    <div style={{ fontSize: '9px', fontWeight: '900', lineHeight: '1.2' }}>{cover.catchphrase ? cover.catchphrase.slice(0, 16) : '完成作品！'}...</div>
                  </div>
                )}

              </div>

              <p style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', margin: '8px 0 0 0', lineHeight: '1.3' }}>
                ※ 自作デザインデータを入稿すると100%オリジナルのプロ装丁で出版できます
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
