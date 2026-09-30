(() => {
  const root = document.querySelector("[data-books-url]");
  if (!root) return;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  function parseBookLine(line, defaults = {}) {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length < 3) return null;

    const [rawTitle, author, ...rest] = parts;

    return {
      title: rawTitle.replace(/\*+\s*$/g, "").trim(),
      author,
      priority: /\*+\s*$/.test(rawTitle),
      isbn: rest[rest.length - 1] || "",
      rating: rest.length >= 3 ? rest[rest.length - 3] : "",
      ratingOther: rest.length >= 2 ? rest[rest.length - 2] : "",
      status: defaults.status || "",
      reader: defaults.reader || "Shared",
      notes: []
    };
  }

  function sectionDefaults(title) {
    const normalized = title.toLowerCase().trim();
    if (normalized.includes("roxy")) {
      return { status: "Currently Reading", reader: "XY" };
    }
    if (normalized === "read" || normalized.startsWith("read ")) {
      return { status: "Already Read", reader: "Shared" };
    }
    if (normalized.startsWith("to read")) {
      return { status: "Reading Next", reader: "Shared" };
    }
    return { status: "", reader: "Shared" };
  }

  function parseMarkdown(markdown) {
    const sections = [];
    let section = null;
    let book = null;

    for (const rawLine of markdown.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith("# ")) {
        const title = line.slice(2).trim();
        section = { title, intro: "", books: [], ...sectionDefaults(title) };
        sections.push(section);
        book = null;
        continue;
      }

      if (!section) continue;

      if (line.startsWith("## ")) {
        book = parseBookLine(line.slice(3).trim(), section);
        if (book) section.books.push(book);
        continue;
      }

      if (line.includes("|") && !line.startsWith("- ")) {
        book = parseBookLine(line, section);
        if (book) section.books.push(book);
        continue;
      }

      if (line.startsWith("- ") && book) {
        const entry = line.slice(2);
        const metadata = entry.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (metadata) {
          book[metadata[1]] = metadata[2].trim();
        } else {
          book.notes.push(entry);
        }
      } else if (book) {
        book.notes.push(line);
      } else {
        section.intro = section.intro ? `${section.intro} ${line}` : line;
      }
    }

    return sections;
  }

  function coverURL(book, size = "M") {
    if (book.cover) return book.cover;
    if (!book.isbn) return "";
    return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(
      book.isbn.replace(/[^0-9Xx]/g, "")
    )}-${size}.jpg?default=false`;
  }

  function readingCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const reader = escapeHTML(book.reader);
    const status = book.status;
    const src = escapeHTML(coverURL(book));
    const goodreads = book.isbn
      ? `https://www.goodreads.com/search?q=${encodeURIComponent(book.isbn)}`
      : "";

    return `<article class="book-card current-reading-card reading-room-${status === "Currently Reading" ? "current" : "next"}-card" data-reader="${reader}">
      <div class="current-book-grid">
        <div class="cover-frame current-cover${src ? "" : " is-fallback"}">${src ? `<img src="${src}" alt="Cover of ${title} by ${author}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')">` : ""}<div class="fallback-cover" aria-hidden="true">Cover unavailable</div></div>
        <div class="reading-room-copy">
          <span class="reader-badge mb-4 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em]">${status === "Currently Reading" ? `${reader} is reading` : `${reader}'s pick`}</span>
          <h3 class="editorial-heading">${title}</h3>
          <p class="book-author">${author}</p>
          ${book.description ? `<p class="book-description">${escapeHTML(book.description)}</p>` : ""}
          ${goodreads ? `<a class="focus-ring link-line" href="${goodreads}" target="_blank" rel="noopener noreferrer">Find it on Goodreads</a>` : ""}
        </div>
      </div>
    </article>`;
  }

  function radarCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const src = escapeHTML(coverURL(book, "L"));
    const goodreads = book.goodreads || (
      book.isbn
        ? `https://www.goodreads.com/search?q=${encodeURIComponent(book.isbn)}`
        : ""
    );
    const reader = escapeHTML(book.reader);

    return `<article class="book-card radar-card" data-reader="${reader}">
      <div class="radar-cover cover-frame${src ? "" : " is-fallback"}">${src ? `<img src="${src}" alt="Cover of ${title} by ${author}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')">` : ""}<div class="fallback-cover" aria-hidden="true">Cover unavailable</div></div>
      <div class="radar-copy"><span class="reader-badge">${reader}</span><h3 class="editorial-heading">${title}</h3><p>${author}</p>${goodreads ? `<a class="link-line focus-ring" href="${escapeHTML(goodreads)}" target="_blank" rel="noopener noreferrer">Find it on Goodreads</a>` : ""}</div>
    </article>`;
  }

  function archiveCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const src = escapeHTML(coverURL(book, "L"));
    const reader = escapeHTML(book.reader);
    const reflections = Array.isArray(book.notes)
      ? book.notes
      : book.notes
        ? [book.notes]
        : [];
    const notes = reflections.map((note) => `<p class="archive-reflection">${escapeHTML(note)}</p>`).join("");

    return `<article class="book-card archive-card" data-reader="${reader}">
      <div class="archive-cover cover-frame${src ? "" : " is-fallback"}">${src ? `<img src="${src}" alt="Cover of ${title} by ${author}" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')">` : ""}<div class="fallback-cover" aria-hidden="true">Cover unavailable</div></div>
      <div class="archive-content"><div class="archive-top"><span class="reader-badge">${reader}</span>${book.rating ? `<span class="archive-rating">${escapeHTML(book.rating)} / 5</span>` : ""}</div><h3 class="editorial-heading archive-title">${title}</h3><p class="archive-author">${author}</p>${notes}</div>
    </article>`;
  }

  function previewCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const src = escapeHTML(coverURL(book, "L"));
    return `<article class="preview-card"><div class="preview-cover">${src ? `<img src="${src}" alt="Cover of ${title} by ${author}" loading="lazy" onerror="this.style.display='none'">` : ""}</div><div class="preview-copy"><h3 class="editorial-heading">${title}</h3><p>${author}</p></div></article>`;
  }

  function archivePreview(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const reflections = Array.isArray(book.notes)
      ? book.notes
      : book.notes
        ? [book.notes]
        : [];
    const notes = reflections.slice(0, 1).map((note) => `<p class="archive-preview-reflection">${escapeHTML(note)}</p>`).join("");
    return `<article class="archive-preview-card"><div class="archive-preview-top"><span>${book.rating ? `${escapeHTML(book.rating)} / 5` : ""}</span></div><h3 class="editorial-heading">${title}</h3><p class="archive-preview-author">${author}</p>${notes}</article>`;
  }

  function setBooks(target, books, renderCard) {
    if (!target) return;
    target.innerHTML = books.length
      ? books.map(renderCard).join("")
      : '<p class="content-empty">No books are available in books.md for this shelf.</p>';
  }

  function renderHome(sections) {
    const books = sections.flatMap((item) =>
      item.books.map((book) => ({ ...book, section: item.title }))
    );
    const current = books.filter((book) => book.status === "Currently Reading");
    const next = books.filter((book) => book.status === "Reading Next");
    const toRead = sections
      .filter((item) => /^to read/i.test(item.title) || /^roxy's list/i.test(item.title))
      .flatMap((item) => item.books)
      .slice(0, 3);
    const read = sections.find((item) => item.title.toLowerCase() === "read");

    setBooks(document.querySelector("[data-reading-current]"), current, readingCard);
    setBooks(document.querySelector("[data-reading-next]"), next, readingCard);
    setBooks(document.querySelector(".radar-preview-grid"), toRead, previewCard);
    setBooks(document.querySelector(".archive-preview-grid"), (read?.books || []).slice(0, 2), archivePreview);
    document.querySelectorAll(".reader-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const filter = tab.dataset.filter;
        document.querySelectorAll(".reader-tab").forEach((item) =>
          item.setAttribute("aria-selected", String(item === tab))
        );
        document.querySelectorAll(".book-card[data-reader]").forEach((card) =>
          card.classList.toggle("is-filtered", filter !== "all" && card.dataset.reader !== filter)
        );
      });
    });
  }

  async function loadBooks() {
    try {
      const response = await fetch(root.dataset.booksUrl, {
        headers: { Accept: "text/markdown,text/plain" }
      });
      if (!response.ok) throw new Error(`Could not load books.md: HTTP ${response.status}`);

      const markdown = await response.text();
      if (!markdown.trim()) throw new Error("books.md is empty.");
      const sections = parseMarkdown(markdown);
      const view = root.dataset.booksView;

      if (view === "home") {
        renderHome(sections);
        return;
      }

      const isRead = view === "already-read";
      const section = isRead
        ? sections.find((item) => item.title.toLowerCase() === "read")
        : null;
      const books = isRead
        ? section?.books || []
        : sections
            .filter((item) => /^to read/i.test(item.title) || /^roxy's list/i.test(item.title))
            .flatMap((item) => item.books);

      const title = isRead ? "Already Read" : "On the Radar";
      const intro = isRead
        ? section?.intro || "Books we’ve finished reading together."
        : "Books we’re considering for a future read.";
      const titleElement = document.querySelector("[data-books-title]");
      const introElement = document.querySelector("[data-books-intro]");
      if (titleElement) titleElement.textContent = title;
      if (introElement) introElement.textContent = intro;
      setBooks(
        document.querySelector("[data-books-list]"),
        books,
        isRead ? archiveCard : radarCard
      );
    } catch (error) {
      console.error("Book content load failed", error);
      const message = `<p class="content-error" role="alert">The books could not be loaded. ${escapeHTML(error.message)}</p>`;
      const list = document.querySelector("[data-books-list]");
      if (list) {
        list.innerHTML = message;
      } else {
        document.querySelectorAll("[data-reading-current], [data-reading-next], .radar-preview-grid, .archive-preview-grid")
          .forEach((target) => { target.innerHTML = message; });
      }
    }
  }

  loadBooks();
})();
