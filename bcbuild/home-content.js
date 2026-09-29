(() => {
  if (!document.querySelector('[data-reading-room-url]')) return;
  const PLACEHOLDER_COVER = 'https://dryofg8nmyqjw.cloudfront.net/images/no-cover.png';
  const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const coverURL = (book) => (book.isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(String(book.isbn).replace(/[^0-9Xx]/g,''))}-M.jpg?default=false` : PLACEHOLDER_COVER);
  const cover = (book) => `<div class="preview-cover cover-frame" data-cover-frame><img alt="Cover of ${escapeHTML(book.title)} by ${escapeHTML(book.author || '')}" loading="lazy" src="${escapeHTML(coverURL(book))}" onerror="this.onerror=null;this.src='${PLACEHOLDER_COVER}';this.alt='No cover available';this.closest('[data-cover-frame]').classList.add('is-fallback')"><div class="fallback-cover" aria-hidden="true">Book club</div></div>`;
  const goodreads = (book) => book.goodreads || (book.isbn ? `https://www.goodreads.com/search?q=${encodeURIComponent(String(book.isbn).replace(/[^0-9Xx]/g,''))}` : '#');
  const card = (book, sectionTitle) => `<article class="preview-card radar-preview-card">${cover(book)}<div class="preview-copy"><span class="reader-badge">${escapeHTML(sectionTitle.replace(/^To read\s*-\s*/i,''))}</span><h3 class="editorial-heading">${escapeHTML(book.title)}</h3><p>${escapeHTML(book.author || '')}</p>${goodreads(book) !== '#' ? `<a class="focus-ring" href="${escapeHTML(goodreads(book))}" target="_blank" rel="noopener noreferrer">Find it on Goodreads</a>` : ''}</div></article>`;
  const archive = (book) => `<article class="archive-preview-card">${cover(book)}<div class="archive-preview-top"><span>${book.rating ? `${escapeHTML(book.rating)} / 5` : ''}</span></div><h3 class="editorial-heading">${escapeHTML(book.title)}</h3><p class="archive-preview-author">${escapeHTML(book.author || '')}</p>${book.review ? `<p class="archive-preview-reflection">${escapeHTML(book.review)}</p>` : ''}${(book.notes || []).slice(0,1).map((n) => `<p class="archive-preview-reflection">${escapeHTML(n)}</p>`).join('')}</article>`;
  document.addEventListener('bookclub:loaded', (event) => {
    const { sections } = event.detail;
    const radarSections = sections.filter((s) => /^to read\s*-/i.test(s.title));
    const radarBooks = radarSections.flatMap((s) => s.books.map((book) => ({ book, sectionTitle: s.title }))).slice(0, 3);
    const read = sections.find((s) => s.title.toLowerCase() === 'read');
    const readBooks = (read?.books || []).slice(0, 2);
    const radar = document.querySelector('.radar-preview-grid');
    const archiveGrid = document.querySelector('.archive-preview-grid');
    if (radar) radar.innerHTML = radarBooks.map(({book, sectionTitle}) => card(book, sectionTitle)).join('');
    if (archiveGrid) archiveGrid.innerHTML = readBooks.map(archive).join('');
  });
})();
