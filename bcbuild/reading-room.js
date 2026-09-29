(() => {
  const root = document.querySelector('[data-reading-room-url]');
  if (!root) return;

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
    const rating = rest.length >= 3 ? rest[rest.length - 3] : '';
    const ratingOther = rest.length >= 2 ? rest[rest.length - 2] : '';
    return { title, author, isbn, priority, rating, ratingOther };
  }

  function parseMarkdown(markdown) {
    const lines = markdown.split(/\r?\n/);
    const sections = [];
    let section = null;
    let book = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('# ')) {
        section = { title: line.slice(2).trim(), books: [] };
        sections.push(section);
        book = null;
        continue;
      }
      if (line.startsWith('## ')) {
        if (!section) continue;
        const pipeBook = parseBookLine(line.slice(3).trim());
        book = pipeBook || { title: line.slice(3).trim() };
        section.books.push(book);
        continue;
      }
      // To-read sections use plain pipe-delimited book lines.
      if (section && /^to read\s*-/i.test(section.title) && line.includes('|') && !line.startsWith('- ')) {
        const parsed = parseBookLine(line);
        if (parsed) { section.books.push(parsed); book = parsed; continue; }
      }
      if (section && line.includes('|') && !line.startsWith('- ')) {
        const parsed = parseBookLine(line);
        if (parsed) { section.books.push(parsed); book = line.startsWith('## ') ? parsed : null; }
      }
      if (section && book && line.startsWith('- ')) {
        const match = line.slice(2).match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) book[match[1]] = match[2].trim();
      }
    }
    return sections;
  }

  const coverURL = (book) => {
    if (book.cover) return book.cover;
    if (book.isbn) return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-L.jpg?default=false`;
    return '';
  };

  const card = (book, status) => {
    const title = escapeHTML(book.title || '');
    const author = escapeHTML(book.author || '');
    const reader = escapeHTML(book.reader || 'Shared');
    const src = escapeHTML(coverURL(book));
    const goodreads = escapeHTML(book.goodreads || '#');
    const description = escapeHTML(book.description || '');
    const label = status === 'Currently Reading' ? `${reader} is reading` : `${reader}'s pick`;
    return `<article class="book-card current-reading-card reading-room-${status === 'Currently Reading' ? 'current' : 'next'}-card" data-reader="${reader}">
      <div class="current-book-grid">
        <div class="cover-frame current-cover"><img src="${src}" alt="Cover of ${title} by ${author}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')"><div class="fallback-cover" aria-hidden="true">Cover unavailable</div></div>
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
      const current = books.filter((book) => book.status === 'Currently Reading');
      const next = books.filter((book) => book.status === 'Reading Next');
      const currentList = document.querySelector('[data-reading-current]');
      const nextList = document.querySelector('[data-reading-next]');
      if (currentList) currentList.innerHTML = current.length ? current.map((book) => card(book, 'Currently Reading')).join('') : '<p class="content-empty">No books are marked <strong>Currently Reading</strong> in books.md.</p>';
      if (nextList) nextList.innerHTML = next.length ? next.map((book) => card(book, 'Reading Next')).join('') : '<p class="content-empty">No books are marked <strong>Reading Next</strong> in books.md.</p>';
      window.BookClubBooks = { sections, books, coverURL };
      document.dispatchEvent(new CustomEvent('bookclub:loaded', { detail: window.BookClubBooks }));
    } catch (error) {
      console.error('Reading room load failed', error);
    }
  }

  load();
})();
