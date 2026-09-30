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

  function isNextSynchPick(title) {
    return /^next\s+syn(?:c|ch)\s+pick$/i.test(title.trim());
  }

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
      description: "",
      notes: []
    };
  }

  function sectionDefaults(title) {
    const normalized = title.toLowerCase().trim();
    const readingMatch = normalized.match(/^(xy|zz) is reading$/);
    if (readingMatch) {
      return { status: "Currently Reading", reader: readingMatch[1].toUpperCase() };
    }
    if (isNextSynchPick(normalized)) {
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
    if (isNextSynchPick(trimmed)) return "Shared Reading";
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
        if (book.status === "Already Read" && !book.description) {
          book.description = line;
        } else {
          book.notes.push(line);
        }
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
    const badge = status === "Currently Reading"
      ? `<span class="reader-badge mb-4 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em]">${reader} is reading</span>`
      : reader === "Shared"
        ? shelfBadge(book)
        : `<span class="reader-badge mb-4 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em]">${reader}'s pick</span>`;

    return `<a aria-label="View ${title} by ${author} on Goodreads" class="book-card book-card-link current-reading-card reading-room-${status === "Currently Reading" ? "current" : "next"}-card focus-ring" data-reader="${reader}" href="${escapeHTML(goodreadsURL(book))}" target="_blank" rel="noopener noreferrer">
      <div class="current-book-grid">
        <div class="cover-frame current-cover">${coverImage(book, "L", "cover", `Cover of ${book.title} by ${book.author}`)}</div>
        <div class="reading-room-copy">
          ${badge}
          <h3 class="editorial-heading">${title}</h3>
          <p class="book-author">${author}</p>
          ${book.description ? `<p class="book-description">${escapeHTML(book.description)}</p>` : ""}
        </div>
      </div>
    </a>`;
  }

  function radarCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const reader = escapeHTML(book.reader);

    return `<a aria-label="View ${title} by ${author} on Goodreads" class="book-card book-card-link radar-card focus-ring" data-reader="${reader}" href="${escapeHTML(goodreadsURL(book))}" target="_blank" rel="noopener noreferrer">
      <div class="radar-cover cover-frame">${coverImage(book, "L", "", `Cover of ${book.title} by ${book.author}`)}</div>
      <div class="radar-copy">${shelfBadge(book)}<h3 class="editorial-heading">${title}</h3><p>${author}</p></div>
    </a>`;
  }

  function archiveCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const description = book.description
      ? `<p class="archive-description">${escapeHTML(book.description)}</p>`
      : "";
    const reflections = Array.isArray(book.notes)
      ? book.notes
      : book.notes
        ? [book.notes]
        : [];
    const notes = reflections.map((note) => `<p class="archive-reflection">${escapeHTML(note)}</p>`).join("");
    const reviewDisclosure = notes
      ? `<details class="archive-review"><summary>Read More...</summary><div class="archive-review-copy">${notes}</div></details>`
      : "";

    return `<article class="book-card archive-card read-review-card" data-reader="Shared">
      <a aria-label="View ${title} by ${author} on Goodreads" class="archive-card-link focus-ring" href="${escapeHTML(goodreadsURL(book))}" target="_blank" rel="noopener noreferrer"></a>
      <div class="archive-cover cover-frame">${coverImage(book, "L", "", `Cover of ${book.title} by ${book.author}`)}</div>
      <div class="archive-content"><h3 class="editorial-heading archive-title">${title}</h3><p class="archive-author">${author}</p>${bookRatings(book)}</div>
      ${description}
      ${reviewDisclosure}
    </article>`;
  }

  function previewCard(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    return `<a aria-label="View ${title} by ${author} in The Stacks" class="book-card current-reading-card reading-room-next-card focus-ring" data-reader="Shared" href="/bcbuild/radarview"><div class="current-book-grid"><div class="cover-frame current-cover">${coverImage(book, "L", "cover", `Cover of ${book.title} by ${book.author}`)}</div><div class="reading-room-copy">${shelfBadge(book)}<h3 class="editorial-heading">${title}</h3><p class="book-author">${author}</p></div></div></a>`;
  }

  function archivePreview(book) {
    const title = escapeHTML(book.title);
    const author = escapeHTML(book.author);
    const cover = coverImage(book, "L", "", `Cover of ${book.title} by ${book.author}`);
    const description = book.description
      ? `<p class="archive-preview-description">${escapeHTML(book.description)}</p>`
      : "";
    return `<a aria-label="Read reviews for ${title} by ${author}" class="archive-preview-card focus-ring" href="/bcbuild/readview"><div class="archive-preview-cover">${cover}</div><div class="archive-preview-copy"><h3 class="editorial-heading">${title}</h3><p class="archive-preview-author">${author}</p>${bookRatings(book)}</div>${description}</a>`;
  }

  function setBooks(target, books, renderCard) {
    if (!target) return;
    target.innerHTML = books.length
      ? books.map(renderCard).join("")
      : '<p class="content-empty">No books are available in books.md for this shelf.</p>';
  }

  function wireReviewDisclosure(target) {
    if (!target) return;

    target.addEventListener("pointerover", (event) => {
      if (event.pointerType !== "mouse") return;
      const review = event.target.closest(".archive-review");
      if (!review || review.contains(event.relatedTarget)) return;
      review.dataset.pointerHover = "true";
      review.open = true;
    });
    target.addEventListener("pointerout", (event) => {
      if (event.pointerType !== "mouse") return;
      const review = event.target.closest(".archive-review");
      if (!review || review.contains(event.relatedTarget)) return;
      delete review.dataset.pointerHover;
      if (!review.contains(document.activeElement)) review.open = false;
    });
    target.addEventListener("focusin", (event) => {
      const review = event.target.closest(".archive-review");
      if (review) review.open = true;
    });
    target.addEventListener("focusout", (event) => {
      const review = event.target.closest(".archive-review");
      if (review && !review.contains(event.relatedTarget) && review.dataset.pointerHover !== "true") {
        review.open = false;
      }
    });
  }

  function renderHome(sections) {
    const books = sections.flatMap((item) =>
      item.books.map((book) => ({ ...book, section: item.title }))
    );
    const current = books.filter((book) => book.status === "Currently Reading");
    const next = sections
      .filter((item) => isNextSynchPick(item.title))
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
    const recentReads = (read?.books || []).slice(0, 3);
    setBooks(document.querySelector(".archive-preview-grid"), recentReads, archivePreview);
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

      if (!isRead) {
        const introElement = document.querySelector("[data-books-intro]");
        if (introElement) introElement.textContent = "Books we’re considering for a future read.";
      }
      setBooks(
        document.querySelector("[data-books-list]"),
        books,
        isRead ? archiveCard : radarCard
      );
      if (isRead) wireReviewDisclosure(document.querySelector("[data-books-list]"));
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
