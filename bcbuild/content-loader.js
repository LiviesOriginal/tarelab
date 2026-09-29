(() => {
  const root = document.querySelector("[data-content-url]");
  if (!root) return;

  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[char]));

  function parseMarkdown(markdown) {
    const lines = markdown.split(/\r?\n/);
    const data = { title: "", intro: "", books: [] };
    let current = null;
    let paragraph = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      const text = paragraph.join(" ").trim();
      if (text && !data.intro) data.intro = text;
      paragraph = [];
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { flushParagraph(); continue; }

      if (line.startsWith("# ")) {
        data.title = line.slice(2).trim();
        continue;
      }

      if (line.startsWith("## ")) {
        flushParagraph();
        current = { title: line.slice(3).trim() };
        data.books.push(current);
        continue;
      }

      const match = line.match(/^- ([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (match && current) {
        current[match[1]] = match[2].trim();
        continue;
      }

      if (!current) paragraph.push(line);
    }
    flushParagraph();
    return data;
  }

  function bookCard(book, mode) {
    const reader = escapeHTML(book.reader || "Shared");
    const title = escapeHTML(book.title || "");
    const author = escapeHTML(book.author || "");
    const cover = escapeHTML(book.cover || "");
    const goodreads = escapeHTML(book.goodreads || "#");

    if (mode === "already-read") {
      const rating = book.rating ? escapeHTML(book.rating) : "";
      const quote = book.quote ? `“${escapeHTML(book.quote)}”` : "";
      const reflection = escapeHTML(book.reflection || "");
      return `<article class="book-card archive-card" data-reader="${reader}">
        <div class="archive-top"><span class="reader-badge">${reader}</span>${rating ? `<span class="archive-rating">${rating} / 5</span>` : ""}</div>
        <h3 class="editorial-heading archive-title">${title}</h3>
        <p class="archive-author">${author}</p>
        ${quote ? `<blockquote>${quote}</blockquote>` : ""}
        ${reflection ? `<p class="archive-reflection">${reflection}</p>` : ""}
      </article>`;
    }

    return `<article class="book-card radar-card" data-reader="${reader}">
      <div class="radar-cover cover-frame"><img src="${cover}" alt="Cover of ${title} by ${author}" loading="lazy"><div class="fallback-cover" aria-hidden="true">Book club</div></div>
      <div class="radar-copy">
        <span class="reader-badge">${reader}</span>
        <h3 class="editorial-heading">${title}</h3>
        <p>${author}</p>
        ${goodreads !== "#" ? `<a class="link-line focus-ring" href="${goodreads}" target="_blank" rel="noopener noreferrer">Find it on Goodreads</a>` : ""}
      </div>
    </article>`;
  }

  async function load() {
    try {
      const response = await fetch(root.dataset.contentUrl, { headers: { Accept: "text/markdown,text/plain" }});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = parseMarkdown(await response.text());
      document.title = `${data.title} · Book Club for Two`;
      const title = document.querySelector("[data-content-title]");
      const intro = document.querySelector("[data-content-intro]");
      const list = document.querySelector("[data-content-list]");
      if (title) title.textContent = data.title;
      if (intro) intro.textContent = data.intro;
      if (list) list.innerHTML = data.books.map(book => bookCard(book, root.dataset.mode)).join("");
    } catch (error) {
      console.error("Content load failed", error);
      const errorEl = document.querySelector("[data-content-error]");
      if (errorEl) errorEl.hidden = false;
    }
  }

  load();
})();