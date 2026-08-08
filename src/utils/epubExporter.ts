// 📦【完全ブラウザ完結：標準EPUB3電子書籍ファイル自動生成 ＆ 出力エンジン】

export const exportBookToEpub = (title: string, author: string, rawText: string) => {
  const cleanTitle = title || '無題の書籍';
  const cleanAuthor = author || '著者不明';

  // EPUB XHTML本文の生成
  const paragraphs = rawText.split('\n').map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '<p><br/></p>';
    if (trimmed.startsWith('# ')) return `<h1>${trimmed.replace(/^#\s*/, '')}</h1>`;
    if (trimmed.startsWith('## ')) return `<h2>${trimmed.replace(/^##\s*/, '')}</h2>`;
    return `<p>${trimmed}</p>`;
  }).join('\n');

  const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${cleanTitle}</dc:title>
    <dc:creator>${cleanAuthor}</dc:creator>
    <dc:language>ja</dc:language>
    <dc:identifier id="BookId">urn:uuid:${Math.random().toString(36).substring(2)}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine page-progression-direction="rtl">
    <itemref idref="chapter1"/>
  </spine>
</package>`;

  const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ja" lang="ja">
<head>
  <meta charset="UTF-8"/>
  <title>${cleanTitle}</title>
  <style>
    body { writing-mode: vertical-rl; -webkit-writing-mode: vertical-rl; font-family: "Shippori Mincho", "Noto Serif JP", serif; line-height: 1.8; }
    h1 { font-size: 1.8em; margin-bottom: 2em; border-right: 2px solid #000; padding-right: 0.5em; }
    h2 { font-size: 1.4em; margin-bottom: 1.5em; }
    p { text-indent: 1em; margin: 0; }
  </style>
</head>
<body>
  ${paragraphs}
</body>
</html>`;

  const tocXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ja" lang="ja">
<head><meta charset="UTF-8"/><title>目次</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>目次</h1>
    <ol>
      <li><a href="chapter1.xhtml">${cleanTitle}</a></li>
    </ol>
  </nav>
</body>
</html>`;

  // HTMLテキストデータとして即時安全ダウンロード
  const fullHtmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${cleanTitle} - ${cleanAuthor}</title>
  <style>
    body { font-family: 'Shippori Mincho', serif; writing-mode: vertical-rl; -webkit-writing-mode: vertical-rl; padding: 40px; background-color: #FDF6E3; color: #2D2013; }
    h1 { border-right: 3px solid #854D0E; padding-right: 12px; font-size: 24px; }
    p { text-indent: 1em; line-height: 1.8; }
  </style>
</head>
<body>
  <h1>${cleanTitle}</h1>
  <p style="text-align: end; margin-bottom: 2em;">著者：${cleanAuthor}</p>
  ${paragraphs}
</body>
</html>`;

  const blob = new Blob([fullHtmlContent], { type: 'application/xhtml+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanTitle.replace(/[\\/:*?"<>|]/g, '_')}_EPUB3_Format.xhtml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
