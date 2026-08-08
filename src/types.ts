export type BookType = 'reflow' | 'fixed' | 'comic';

export type FontTheme = 'shippori' | 'serif' | 'sans' | 'zen';
export type PaperTheme = 'bunkobon' | 'sepia' | 'dark' | 'white';

export type PresetKey = 'bunko' | 'shinsho' | 'business' | 'tankoubon' | 'lightnovel' | 'magazine' | 'manga';

export interface TypographySettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  paragraphMargin: number;
  columnCount: number;
  theme: 'light' | 'dark' | 'sepia' | 'bunkobon' | 'white';
  writingMode: 'vertical-rl' | 'horizontal-tb';
  fontFamily: string;
  fontTheme?: FontTheme;
  paperTheme?: PaperTheme;
  preset?: PresetKey;
  enableDropCap: boolean;
  chapterStyle: 'fancy' | 'minimal' | 'plain' | 'underlined' | 'accent-box' | 'bold-huge';
  charsPerLine?: number;
  linesPerPage?: number;
  headingStyle?: 'tobira' | 'inline';
}

export interface CoverSettings {
  title: string;
  author: string;
  publisher?: string;
  coverImage?: string;
  bgImageUrl?: string;
  themeColor?: string;
  accentColor?: string;
  titlePos?: { x: number; y: number };
  authorPos?: { x: number; y: number };
  titleFontSize?: number;
  authorFontSize?: number;
  layoutPattern?: 'classic' | 'modern' | 'minimal' | 'cyber';
  subtitle?: string;
  category?: string;
  genre?: string;
  catchphrase?: string;
  showBand?: boolean;
  bandColor?: string;
  bandTextColor?: string;
  titleColor?: string;
  titlePosition?: 'center' | 'top-right' | 'top-left' | 'bottom-right' | 'top';
  titleFont?: string;
  style?: string;
  prompt?: string;
  badgeText?: string;
  gradientOverlay?: boolean | string;
}

export interface ComicPage {
  pageNumber: number;
  imageUrl: string;
  caption?: string;
}

export interface TocItem {
  id: string;
  title: string;
  level: number;
  pageNumber: number;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  price: number;
  rating: number;
  reviewsCount?: number;
  coverImage?: string;
  category?: string;
  genre?: string;
  publishedAt?: string;
  readingDirection?: 'rtl' | 'ltr';
  pageCount?: number;
  description: string;
  salesCount: number;
  revenue?: number;
  rawText?: string;
  chapters?: any[];
  toc?: TocItem[];
  typography: TypographySettings;
  cover: CoverSettings;
  bookType: BookType;
  comicPages?: ComicPage[];
}

export interface ReadingHistoryItem {
  bookTitle: string;
  authorName: string;
  lastReadPageIndex: number;
  totalSinglePages: number;
  progressPercent: number;
  lastReadTime: string;
  isTwoPageSpread: boolean;
}
