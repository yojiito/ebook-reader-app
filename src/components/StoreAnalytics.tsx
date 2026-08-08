import React from 'react';
import { BookItem } from '../types';
import { SAMPLE_BOOKS } from '../data/sampleBooks';
import { 
  ShoppingBag, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface StoreAnalyticsProps {
  currentBook: BookItem;
  onReadBook: (book: BookItem) => void;
}

export const StoreAnalytics: React.FC<StoreAnalyticsProps> = ({ currentBook, onReadBook }) => {
  // 📚 ダミー作品を全削除し、千代目様の正式作品のみを配信表示
  const allBooks = [currentBook];

  return (
    <div style={{ width: '100%', maxWidth: '1150px', margin: '0 auto' }}>
      
      {/* Pure Reader E-Book Store Section - EXACT "SUGUTOMA" 5-COLUMN CARDS */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <ShoppingBag style={{ width: '22px', height: '22px', color: '#F59E0B' }} />
              電子書籍ストア 配信作品一覧
            </h2>
            <p style={{ fontSize: '12px', color: '#94A3B8', margin: '4px 0 0 0' }}>著者「千代目」配信作品</p>
          </div>
          <span style={{ backgroundColor: '#1E1B4B', color: '#A5B4FC', border: '1px solid rgba(99,102,241,0.4)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles style={{ width: '12px', height: '12px', color: '#F59E0B' }} /> 全 1 作品配信中
          </span>
        </div>

        {/* Sugutoma Pure CSS Grid (Guaranteed 5 Columns Desktop / 4 Columns Medium / 2 Columns Mobile) */}
        <div className="sugutoma-grid">
          {allBooks.map((book, idx) => (
            <div
              key={idx}
              className="sugutoma-card"
              onClick={() => onReadBook(book)}
            >
              {/* 3:2 Ratio Image Wrapper Header */}
              <div className="sugutoma-img-wrapper">
                <img
                  src={book.cover.bgImageUrl}
                  alt={book.title}
                  className="sugutoma-img"
                />
                <span className="sugutoma-badge">
                  {book.bookType === 'comic' ? '漫画' : '小説'}
                </span>
                <span className="sugutoma-rating">
                  ★ {book.rating}
                </span>
              </div>

              {/* Card Body */}
              <div className="sugutoma-content">
                <div>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '2px' }}>
                    {book.publishedAt} 配信
                  </div>
                  <h3 className="sugutoma-title" title={book.title}>
                    {book.title}
                  </h3>
                  <div className="sugutoma-author">
                    📍 {book.author}
                  </div>
                </div>

                <div className="sugutoma-footer">
                  <div>
                    <span className="sugutoma-price">
                      ¥{book.price}
                    </span>
                  </div>

                  <button className="sugutoma-btn">
                    読む <ArrowRight style={{ width: '10px', height: '10px' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
