(() => {
  const root = document.querySelector('[data-content-url]');
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
    const rating = rest.length >= 3 ? rest[rest.length - 3] : '';
    const ratingOther = rest.length >= 2 ? rest[rest.length - 2] : '';
    return { title, author, isbn, priority, rating, ratingOther, notes: [], review: '' };
  }

  function parseMarkdown(markdown) {
    const lines = markdown.split(/\r?\n/);
    const sections = [];
    let section = null;
    let book = null;
    const finishBook = () => {
      if (!book) return;
      book.review = (book.reviewLines || []).join(' ').trim();
      delete book.reviewLines;
      book = null;
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (line.startsWith('# ')) {
        finishBook();
        section = { title: line.slice(2).trim(), intro: '', books: [] };
        sections.push(section);
        continue;
      }

      if (line.startsWith('## ')) {
        finishBook();
        if (!section) continue;
        const parsed = parseBookLine(line.slice(3).trim());
        book = parsed || { title: line.slice(3).trim(), notes: [], reviewLines: [] };
        if (!book.reviewLines) book.reviewLines = [];
        section.books.push(book);
        continue;
      }

      // To-read sections use simple pipe-delimited lines directly beneath the H1.
      if (section && line.includes('|') && !line.startsWith('- ')) {
        const parsed = parseBookLine(line);
        if (parsed) {
          finishBook();
          book = parsed;
          section.books.push(book);
          continue;
        }
      }

      if (section && book && line.startsWith('- ')) {
        const text = line.slice(2).trim();
        const match = text.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) book[match[1]] = match[2].trim();
        else book.notes.push(text);
        continue;
      }

      if (section && book && section.title.toLowerCase() === 'read') {
        book.reviewLines.push(line);
      } else if (section && !book) {
        section.intro = section.intro ? `${section.intro} ${line}` : line;
      }
    }
    finishBook();
    return sections;
  }

  function coverURL(book) {
    if (book.isbn) {
      const clean = String(book.isbn).replace(/[^0-9Xx]/g, '');
      return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(clean)}-M.jpg?default=false`;
    }
    return PLACEHOLDER_COVER;
  }

  function goodreadsURL(book) {
    if (book.goodreads) return book.goodreads;
    const isbn = String(book.isbn || '').replace(/[^0-9Xx]/g, '');
    return isbn ? `https://www.goodreads.com/search?q=${encodeURIComponent(isbn)}` : '#';
  }

  function coverMarkup(book, extraClass = '') {
    const title = escapeHTML(book.title || '');
    const author = escapeHTML(book.author || '');
    const src = escapeHTML(coverURL(book));
    return `<div class="cover-frame ${extraClass}" data-cover-frame><img src="${src}" alt="Cover of ${title} by ${author}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_COVER}';this.alt='No cover available';this.closest('[data-cover-frame]').classList.add('is-fallback')"><div class="fallback-cover" aria-hidden="true">Book club</div></div>`;
  }

  function radarCard(book) {
    const title = escapeHTML(book.title); const author = escapeHTML(book.author || '');
    const goodreads = escapeHTML(goodreadsURL(book));
    return `<article class="book-card radar-card" data-reader="${escapeHTML(book.reader || 'Shared')}">
      ${coverMarkup(book, 'radar-cover')}
      <div class="radar-copy"><span class="reader-badge">${escapeHTML(book.reader || 'Shared')}</span><h3 class="editorial-heading">${title}</h3><p>${author}</p>${goodreads !== '#' ? `<a class="link-line focus-ring" href="${goodreads}" target="_blank" rel="noopener noreferrer">Find it on Goodreads</a>` : ''}</div>
    </article>`;
  }

  function archiveCard(book) {
    const title = escapeHTML(book.title); const author = escapeHTML(book.author || '');
    const notes = (book.notes || []).map((note) => `<p class="archive-reflection">${escapeHTML(note)}</p>`).join('');
    const review = book.review ? `<p class="archive-reflection">${escapeHTML(book.review)}</p>` : '';
    return `<article class="book-card archive-card" data-reader="${escapeHTML(book.reader || 'Shared')}">
      ${coverMarkup(book, 'archive-cover')}
      <div class="archive-content"><div class="archive-top"><span class="reader-badge">${escapeHTML(book.reader || 'Shared')}</span>${book.rating ? `<span class="archive-rating">${escapeHTML(book.rating)} / 5</span>` : ''}</div><h3 class="editorial-heading archive-title">${title}</h3><p class="archive-author">${author}</p>${review}${notes}</div>
    </article>`;
  }

  function listSection(section) {
    const id = section.title.toLowerCase().replace(/^to read\s*-\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `<section class="radar-category" id="${escapeHTML(id)}"><div class="radar-category-header"><p class="section-kicker">On the Radar</p><h2 class="editorial-heading section-title">${escapeHTML(section.title.replace(/^To read\s*-\s*/i, ''))}</h2></div><div class="content-grid">${section.books.map(radarCard).join('')}</div></section>`;
  }

  async function load() {
    try {
      const response = await fetch(root.dataset.contentUrl, { headers: { Accept: 'text/markdown,text/plain' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const sections = parseMarkdown(await response.text());
      const mode = root.dataset.mode;
      const title = document.querySelector('[data-content-title]');
      const intro = document.querySelector('[data-content-intro]');
      const list = document.querySelector('[data-content-list]');

      if (mode === 'already-read') {
        const section = sections.find((item) => item.title.toLowerCase() === 'read');
        if (title) title.textContent = 'Already Read';
        if (intro) intro.textContent = 'Books recorded in the Read section of books.md.';
        if (list) list.innerHTML = section?.books?.length ? section.books.map(archiveCard).join('') : '<p class="content-empty">No books are available in the Read section of books.md.</p>';
      } else {
        const radarSections = sections.filter((item) => /^to read\s*-/i.test(item.title));
        if (title) title.textContent = 'On the Radar';
        if (intro) intro.textContent = 'Books grouped exactly by the To read sections in books.md.';
        if (list) list.innerHTML = radarSections.length ? radarSections.map(listSection).join('') : '<p class="content-empty">No To read sections are available in books.md.</p>';
      }
    } catch (error) {
      console.error('Content load failed', error);
      const errorEl = document.querySelector('[data-content-error]');
      if (errorEl) errorEl.hidden = false;
    }
  }
  load();
})();
