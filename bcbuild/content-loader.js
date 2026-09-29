(function () {
  const target = document.querySelector('[data-content-url]');
  if (!target) return;

  const esc = (value) => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse = (text) => {
    const lines = text.split(/\r?\n/);
    const result = { title: '', intro: '', books: [] };
    let current = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('# ')) { result.title = line.slice(2).trim(); continue; }
      if (!line.startsWith('## ') && !line.startsWith('- ') && !current && !result.intro) { result.intro = line; continue; }
      if (line.startsWith('## ')) { current = { title: line.slice(3).trim() }; result.books.push(current); continue; }
      if (line.startsWith('- ') && current) {
        const m = line.slice(2).match(/^([^:]+):\s*(.*)$/);
        if (m) current[m[1].trim()] = m[2].trim();
      }
    }
    return result;
  };

  const card = (book, mode) => {
    if (mode === 'already-read') {
      const rating = book.rating ? `<span class="rating-pill">${esc(book.rating)} / 5</span>` : '';
      return `<article class="book-card read-card">
        <div class="read-card-top"><div><p class="section-kicker">${esc(book.reader || 'Shared')}</p><h2>${esc(book.title)}</h2><p class="author">${esc(book.author)}</p></div>${rating}</div>
        ${book.quote ? `<blockquote>${esc(book.quote)}</blockquote>` : ''}
        ${book.reflection ? `<p class="reflection">${esc(book.reflection)}</p>` : ''}
      </article>`;
    }
    return `<article class="book-card radar-card">
      <div class="radar-cover"><img src="${esc(book.cover)}" alt="Cover of ${esc(book.title)} by ${esc(book.author)}" loading="lazy"></div>
      <div class="radar-copy"><p class="section-kicker">${esc(book.reader || 'Shared')}</p><h2>${esc(book.title)}</h2><p class="author">${esc(book.author)}</p><a class="page-link" href="${esc(book.goodreads)}" target="_blank" rel="noopener noreferrer">Find it on Goodreads <span aria-hidden="true">→</span></a></div>
    </article>`;
  };

  fetch(target.dataset.contentUrl)
    .then(r => { if (!r.ok) throw new Error('Could not load content'); return r.text(); })
    .then(text => {
      const data = parse(text);
      const mode = target.dataset.mode;
      document.title = `Book Club for Two — ${data.title}`;
      target.querySelector('[data-page-title]').textContent = data.title;
      target.querySelector('[data-page-intro]').textContent = data.intro;
      target.querySelector('[data-page-grid]').innerHTML = data.books.map(b => card(b, mode)).join('');
    })
    .catch(() => {
      target.querySelector('[data-page-grid]').innerHTML = '<p class="load-error">This shelf could not be loaded right now.</p>';
    });
})();
