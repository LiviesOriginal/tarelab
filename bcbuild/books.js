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

  const noCoverURL =
    "https://dryofg8nmyqjw.cloudfront.net/images/no-cover.png";
  const readers = ["XY", "ZZ"];

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
    const readingMatch = normalized.match(/^(xy|zz) is reading$/);
    if (readingMatch) {
      return { status: "Currently Reading", reader: readingMatch[1].toUpperCase() };
    }
    if (normalized === "next synch pick") {
      return { status: "Reading Next", reader: "Shared" };
    }
    const nextPicksMatch = normalized.match(/^(xy|zz)'s next picks$/);
    if (nextPicksMatch) {
      return { status: "Reading Next", reader: nextPicksMatch[1].toUpperCase() };
    }
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

  function shelfLabel(title = "") {
    const trimmed = title.trim();
    const match = trimmed.match(/^to read(?:\s*-\s*(.*))?$/i);
    return match ? match[1]?.trim() || "To read" : trimmed;
  }

  function shelfBadge(book) {
    const label = shelfLabel(book.sectionTitle || "");
    const spooky = /^spooky season$/i.test(label);
    return `<span class="reader-badge shelf-label${spooky ? " shelf-label-spooky" : ""}">${escapeHTML(label)}</span>`;
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
        if (book) {
          book.sectionTitle = section.title;
          section.books.push(book);
        }
        continue;
      }

      if (line.includes("|") && !line.startsWith("- ")) {
        book = parseBookLine(line, section);
        if (book) {
          book.sectionTitle = section.title;
          section.books.push(book);
        }
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
    if (!book.isbn) return noCoverURL;
    return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(
      book.isbn.replace(/[^0-9Xx]/g, "")
    )}-${size}.jpg?default=false`;
  }

  function coverImage(book, size, className, alt) {
    const src = escapeHTML(coverURL(book, size));
    const fallback = escapeHTML(noCoverURL);
    const isFallback = !book.cover && !book.isbn;
    const imageClass = [className, "book-cover-image", isFallback ? "no-cover-image" : ""]
      .filter(Boolean)
      .join(" ");
    return `<img class="${imageClass}" src="${src}" alt="${escapeHTML(alt)}" loading="lazy" onerror="this.onerror=null;this.classList.add('no-cover-image');this.src='${fallback}';this.alt='No cover available'">`;
  }

  function ratingStars(value, reader) {
    const parsed = Number.parseFloat(value);
    const rating = Number.isFinite(parsed) ? Math.max(0, Math.min(5, parsed)) : 0;
    const label = value
      ? `${reader}: ${rating} out of 5 stars`
      : `${reader}: not rated`;
    const stars = Array.from({ length: 5 }, (_, index) => {
      const state = rating >= index + 1 ? "on" : rating >= index + 0.5 ? "half" : "off";
      return `<span class="${state}">★</span>`;
    }).join("");

    return `<span class="stars" role="img" aria-label="${label}">${stars}</span>`;
  }

  function bookRatings(book) {
    return `<div class="archive-ratings">${readers.map((reader, index) => {
      const rating = index === 0 ? book.rating : book.ratingOther;
      return `<div class="archive-rating-row"><span class="rating-label">${reader}</span>${ratingStars(rating, reader)}</div>`;
    }).join("")}</div>`;
  }

  function goodreadsURL(book) {
    if (typeof book.goodreads === "string") {
      try {
        const url = new URL(book.goodreads);
        if (
          url.protocol === "https:" &&
          (url.hostname === "goodreads.com" || url.hostname.endsWith(".goodreads.com"))
        ) {
          return url.href;
        }
      } catch {
        // Use a Goodreads search if the optional book-specific URL is invalid.
      }
    }

    const isbn = String(book.isbn || "").replace(/[^0-9Xx]/g, "");
    const query = isbn || [book.title, book.author].filter(Boolean).join(" ");
    return `https://www.goodreads.com/search?q=${encodeURIComponent(query)}`;
  }

  function readingCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const reader = escapeHTML(book.reader);
    const status = book.status;

    return `<article class="book-card current-reading-card reading-room-${status === "Currently Reading" ? "current" : "next"}-card" data-reader="${reader}">
      <div class="current-book-grid">
        <div class="cover-frame current-cover">${coverImage(book, "M", "cover", `Cover of ${book.title} by ${book.author}`)}</div>
        <div class="reading-room-copy">
          <span class="reader-badge mb-4 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em]">${status === "Currently Reading" ? `${reader} is reading` : `${reader}'s pick`}</span>
          <h3 class="editorial-heading"><a class="book-title-link focus-ring" href="${escapeHTML(goodreadsURL(book))}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
          <p class="book-author">${author}</p>
          ${book.description ? `<p class="book-description">${escapeHTML(book.description)}</p>` : ""}
        </div>
      </div>
    </article>`;
  }

  function radarCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const reader = escapeHTML(book.reader);

    return `<article class="book-card radar-card" data-reader="${reader}">
      <div class="radar-cover cover-frame">${coverImage(book, "L", "", `Cover of ${book.title} by ${book.author}`)}</div>
      <div class="radar-copy">${shelfBadge(book)}<h3 class="editorial-heading"><a class="book-title-link focus-ring" href="${escapeHTML(goodreadsURL(book))}" target="_blank" rel="noopener noreferrer">${title}</a></h3><p>${author}</p></div>
    </article>`;
  }

  function archiveCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const reader = escapeHTML(book.reader);
    const reflections = Array.isArray(book.notes)
      ? book.notes
      : book.notes
        ? [book.notes]
        : [];
    const notes = reflections.map((note) => `<p class="archive-reflection">${escapeHTML(note)}</p>`).join("");

    return `<article class="book-card archive-card" data-reader="${reader}">
      <div class="archive-cover cover-frame">${coverImage(book, "L", "", `Cover of ${book.title} by ${book.author}`)}</div>
      <div class="archive-content"><div class="archive-top"><span class="reader-badge">${reader}</span></div><h3 class="editorial-heading archive-title"><a class="book-title-link focus-ring" href="${escapeHTML(goodreadsURL(book))}" target="_blank" rel="noopener noreferrer">${title}</a></h3><p class="archive-author">${author}</p>${bookRatings(book)}${notes}</div>
    </article>`;
  }

  function previewCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    return `<a aria-label="View ${title} by ${author} on the Radar" class="book-card current-reading-card reading-room-next-card focus-ring" href="./radarview.html"><div class="current-book-grid"><div class="cover-frame current-cover">${coverImage(book, "M", "cover", `Cover of ${book.title} by ${book.author}`)}</div><div class="reading-room-copy">${shelfBadge(book)}<h3 class="editorial-heading">${title}</h3><p class="book-author">${author}</p></div></div></a>`;
  }

  function archivePreview(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const cover = coverImage(book, "L", "", `Cover of ${book.title} by ${book.author}`);
    return `<a aria-label="Read reviews for ${title} by ${author}" class="archive-preview-card focus-ring" href="./readview.html"><div class="archive-preview-cover">${cover}</div><div class="archive-preview-copy"><h3 class="editorial-heading">${title}</h3><p class="archive-preview-author">${author}</p>${bookRatings(book)}</div></a>`;
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
    const next = sections
      .filter((item) => item.title.toLowerCase().trim() === "next synch pick")
      .flatMap((item) => item.books);
    const individualPicks = sections
      .filter((item) => /^(xy|zz)'s next picks$/i.test(item.title.trim()))
      .flatMap((item) => item.books);
    const toRead = sections
      .filter((item) => /^to read/i.test(item.title) || /^roxy's list/i.test(item.title))
      .map((item) => item.books[0] && { ...item.books[0], sectionTitle: item.title })
      .filter(Boolean);
    const read = sections.find((item) => item.title.toLowerCase() === "read");
    setBooks(document.querySelector("[data-reading-current]"), current, readingCard);
    setBooks(document.querySelector("[data-reading-next]"), next, readingCard);
    setBooks(document.querySelector("[data-next-picks]"), individualPicks, readingCard);
    setBooks(document.querySelector("[data-radar-preview]"), toRead, previewCard);
    const radarLink = document.querySelector("[data-radar-preview-count]");
    if (radarLink) {
      radarLink.textContent = `${String(toRead.length).padStart(2, "0")} / Endless Possibilities →`;
    }
    const recentReads = (read?.books || []).slice(0, 3);
    setBooks(document.querySelector(".archive-preview-grid"), recentReads, archivePreview);
    const readLink = document.querySelector("[data-read-preview-count]");
    if (readLink) {
      readLink.textContent = `${String(recentReads.length).padStart(2, "0")} / Finished books →`;
    }
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
            .flatMap((item) => item.books.map((book) => ({ ...book, sectionTitle: item.title })));

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
        document.querySelectorAll("[data-reading-current], [data-reading-next], [data-next-picks], [data-radar-preview]")
          .forEach((target) => { target.innerHTML = message; });
      }
    }
  }

  loadBooks();
})();
