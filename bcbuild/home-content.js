(() => {
  if (!document.querySelector('[data-reading-room-url]')) return;
  const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const coverURL = (book) => book.cover || (book.isbn ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-L.jpg?default=false` : '');
  const card = (book) => `<article class="preview-card radar-preview-card"><div class="preview-cover"><img alt="Cover of ${escapeHTML(book.title)} by ${escapeHTML(book.author || '')}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')" src="${escapeHTML(coverURL(book))}"></div><div class="preview-copy"><h3 class="editorial-heading">${escapeHTML(book.title)}</h3><p>${escapeHTML(book.author || '')}</p></div></article>`;
  const archive = (book) => `<article class="archive-preview-card"><div class="archive-preview-cover"><img alt="Cover of ${escapeHTML(book.title)} by ${escapeHTML(book.author || '')}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')" src="${escapeHTML(coverURL(book))}"></div><div class="archive-preview-top"><span>${book.rating ? `${escapeHTML(book.rating)} / 5` : ''}</span></div><h3 class="editorial-heading">${escapeHTML(book.title)}</h3><p class="archive-preview-author">${escapeHTML(book.author || '')}</p>${(book.notes || []).slice(0,1).map((n) => `<p class="archive-preview-reflection">${escapeHTML(n)}</p>`).join('')}</article>`;
  document.addEventListener('bookclub:loaded', (event) => {
    const { sections } = event.detail;
    const radarBooks = sections.filter((s) => /^to read/i.test(s.title) || /^roxy's list/i.test(s.title)).flatMap((s) => s.books).slice(0, 3);
    const read = sections.find((s) => s.title.toLowerCase() === 'read');
    const readBooks = (read?.books || []).slice(0, 2);
    const radar = document.querySelector('.radar-preview-grid');
    const archiveGrid = document.querySelector('.archive-preview-grid');
    if (radar) radar.innerHTML = radarBooks.map(card).join('');
    if (archiveGrid) archiveGrid.innerHTML = readBooks.map(archive).join('');
  });
})();
