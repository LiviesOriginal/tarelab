(() => {
  const root = document.querySelector('[data-reading-room-url]');
  if (!root) return;

  const PLACEHOLDER_COVER = 'https://dryofg8nmyqjw.cloudfront.net/images/no-cover.png';
  const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));

  function parseBookLine(line) {
    const parts = line.split('|').map((part) => part.trim());
    if (parts.length < 3) return null;
    const [rawTitle, author, ...rest] = parts;
    const title = rawTitle.replace(/\*+\s*$/g, '').trim();
    const priority = /\*+\s*$/.test(rawTitle);
    const isbn = rest[rest.length - 1] || '';
    return { title, author, isbn, priority, notes: [] };
  }

  function parseMarkdown(markdown) {
    const lines = markdown.split(/\r?\n/);
    const sections = [];
    let section = null;
    let book = null;
    const finishBook = () => { book = null; };
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('# ')) { finishBook(); section = { title: line.slice(2).trim(), books: [] }; sections.push(section); continue; }
      if (line.startsWith('## ')) { finishBook(); if (!section) continue; book = parseBookLine(line.slice(3).trim()) || { title: line.slice(3).trim(), notes: [] }; section.books.push(book); continue; }
      if (section && line.includes('|') && !line.startsWith('- ')) { const parsed = parseBookLine(line); if (parsed) { finishBook(); book = parsed; section.books.push(book); continue; } }
      if (section && book && line.startsWith('- ')) { const text = line.slice(2).trim(); const match = text.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/); if (match) book[match[1]] = match[2].trim(); else book.notes.push(text); }
    }
    return sections;
  }

  const coverURL = (book) => {
    if (book.isbn) return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(String(book.isbn).replace(/[^0-9Xx]/g,''))}-M.jpg?default=false`;
    return PLACEHOLDER_COVER;
  };
  const goodreadsURL = (book) => book.goodreads || (book.isbn ? `https://www.goodreads.com/search?q=${encodeURIComponent(String(book.isbn).replace(/[^0-9Xx]/g,''))}` : '#');
  const coverMarkup = (book) => `<div class="cover-frame current-cover" data-cover-frame><img src="${escapeHTML(coverURL(book))}" alt="Cover of ${escapeHTML(book.title || '')} by ${escapeHTML(book.author || '')}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_COVER}';this.alt='No cover available';this.closest('[data-cover-frame]').classList.add('is-fallback')"><div class="fallback-cover" aria-hidden="true">Book club</div></div>`;

  const card = (book, status) => {
    const title = escapeHTML(book.title || '');
    const author = escapeHTML(book.author || '');
    const reader = escapeHTML(book.reader || 'Shared');
    const goodreads = escapeHTML(goodreadsURL(book));
    const description = escapeHTML(book.description || '');
    const label = status === 'Currently Reading' ? `${reader} is reading` : `${reader}'s pick`;
    return `<article class="book-card current-reading-card reading-room-${status === 'Currently Reading' ? 'current' : 'next'}-card" data-reader="${reader}">
      <div class="current-book-grid">
        ${coverMarkup(book)}
        <div class="reading-room-copy">
          <span class="reader-badge mb-4 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em]">${label}</span>
          <h3 class="editorial-heading">${title}</h3>
          <p class="book-author">${author}</p>
          ${description ? `<p class="book-description">${description}</p>` : ''}
          ${goodreads !== '#' ? `<a class="focus-ring link-line" href="${goodreads}" rel="noopener noreferrer" target="_blank">Find it on Goodreads</a>` : ''}
        </div>
      </div>
    </article>`;
  };

  async function load() {
    try {
      const response = await fetch(root.dataset.readingRoomUrl, { headers: { Accept: 'text/markdown,text/plain' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const sections = parseMarkdown(await response.text());
      const books = sections.flatMap((section) => section.books.map((book) => ({ ...book, section: section.title })));
      const current = books.filter((book) => book.status === 'Currently Reading' || /^currently reading$/i.test(book.section));
      const next = books.filter((book) => book.status === 'Reading Next' || /^reading next$/i.test(book.section));
      const currentList = document.querySelector('[data-reading-current]');
      const nextList = document.querySelector('[data-reading-next]');
      if (currentList) currentList.innerHTML = current.length ? current.map((book) => card(book, 'Currently Reading')).join('') : '<p class="content-empty">No books are marked <strong>Currently Reading</strong> in books.md.</p>';
      if (nextList) nextList.innerHTML = next.length ? next.map((book) => card(book, 'Reading Next')).join('') : '<p class="content-empty">No books are marked <strong>Reading Next</strong> in books.md.</p>';
      window.BookClubBooks = { sections, books, coverURL };
      document.dispatchEvent(new CustomEvent('bookclub:loaded', { detail: window.BookClubBooks }));
    } catch (error) { console.error('Reading room load failed', error); }
  }
  load();
})();
