(() => {
  const root = document.querySelector('[data-content-url]');
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
        section = { title: line.slice(2).trim(), intro: '', books: [] };
        sections.push(section); book = null; continue;
      }
      if (line.startsWith('## ')) {
        if (!section) continue;
        const parsed = parseBookLine(line.slice(3).trim());
        book = parsed || { title: line.slice(3).trim() };
        section.books.push(book); continue;
      }
      // To-read sections use plain pipe-delimited book lines rather than ## headings.
      if (section && /^to read\s*-/i.test(section.title) && line.includes('|') && !line.startsWith('- ')) {
        const parsed = parseBookLine(line);
        if (parsed) { section.books.push(parsed); book = parsed; continue; }
      }
      if (section && !book && !line.startsWith('- ')) {
        section.intro = section.intro ? `${section.intro} ${line}` : line;
      }
      if (section && book && line.startsWith('- ')) {
        const match = line.slice(2).match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) book[match[1]] = match[2].trim();
        else book.notes = [...(book.notes || []), line.slice(2)];
      }
    }
    return sections;
  }

  const coverURL = (book) => book.cover || (book.isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-L.jpg?default=false` : '');

  function radarCard(book) {
    const title = escapeHTML(book.title); const author = escapeHTML(book.author || '');
    const src = escapeHTML(coverURL(book)); const goodreads = escapeHTML(book.goodreads || '#');
    return `<article class="book-card radar-card" data-reader="${escapeHTML(book.reader || 'Shared')}">
      <div class="radar-cover cover-frame"><img src="${src}" alt="Cover of ${title} by ${author}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')"><div class="fallback-cover" aria-hidden="true">Cover unavailable</div></div>
      <div class="radar-copy"><span class="reader-badge">${escapeHTML(book.reader || 'Shared')}</span><h3 class="editorial-heading">${title}</h3><p>${author}</p>${goodreads !== '#' ? `<a class="link-line focus-ring" href="${goodreads}" target="_blank" rel="noopener noreferrer">Find it on Goodreads</a>` : ''}</div>
    </article>`;
  }

  function archiveCard(book) {
    const title = escapeHTML(book.title); const author = escapeHTML(book.author || ''); const src = escapeHTML(coverURL(book));
    const notes = (book.notes || []).map((note) => `<p class="archive-reflection">${escapeHTML(note)}</p>`).join('');
    return `<article class="book-card archive-card" data-reader="${escapeHTML(book.reader || 'Shared')}">
      <div class="archive-cover cover-frame"><img src="${src}" alt="Cover of ${title} by ${author}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')"><div class="fallback-cover" aria-hidden="true">Cover unavailable</div></div>
      <div class="archive-content"><div class="archive-top"><span class="reader-badge">${escapeHTML(book.reader || 'Shared')}</span>${book.rating ? `<span class="archive-rating">${escapeHTML(book.rating)} / 5</span>` : ''}</div><h3 class="editorial-heading archive-title">${title}</h3><p class="archive-author">${author}</p>${notes}</div>
    </article>`;
  }

  async function load() {
    try {
      const response = await fetch(root.dataset.contentUrl, { headers: { Accept: 'text/markdown,text/plain' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const sections = parseMarkdown(await response.text());
      const mode = root.dataset.mode;
      const section = mode === 'already-read'
        ? sections.find((item) => item.title.toLowerCase() === 'read')
        : null;
      const books = mode === 'already-read'
        ? (section?.books || [])
        : sections.filter((item) => /^to read/i.test(item.title) || /^roxy's list/i.test(item.title)).flatMap((item) => item.books);
      const title = document.querySelector('[data-content-title]');
      const intro = document.querySelector('[data-content-intro]');
      const list = document.querySelector('[data-content-list]');
      if (title) title.textContent = mode === 'already-read' ? 'Already Read' : 'On the Radar';
      if (intro) intro.textContent = mode === 'already-read' ? (section?.intro || '') : 'Books from books.md that are on the reading list.';
      if (list) list.innerHTML = books.length ? books.map(mode === 'already-read' ? archiveCard : radarCard).join('') : '<p class="content-empty">No books are available in books.md for this section.</p>';
    } catch (error) {
      console.error('Content load failed', error);
      const errorEl = document.querySelector('[data-content-error]');
      if (errorEl) errorEl.hidden = false;
    }
  }
  load();
})();
