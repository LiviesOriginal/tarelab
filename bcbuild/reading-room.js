(() => {
  const root = document.querySelector("[data-reading-room-url]");
  if (!root) return;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  function sectionDefaults(sectionTitle) {
    const title = sectionTitle.toLowerCase().trim();

    if (title.includes("roxy")) {
      return {
        status: "Currently Reading",
        reader: "XY"
      };
    }

    if (title === "read" || title.startsWith("read ")) {
      return {
        status: "Already Read",
        reader: "Shared"
      };
    }

    if (title.startsWith("to read")) {
      return {
        status: "Reading Next",
        reader: "Shared"
      };
    }

    return {
      status: "",
      reader: "Shared"
    };
  }

  function parseBookLine(line, defaults = {}) {
    const parts = line.split("|").map((part) => part.trim());

    if (parts.length < 3) return null;

    const [rawTitle, author, ...rest] = parts;
    const title = rawTitle.replace(/\*+\s*$/g, "").trim();
    const priority = /\*+\s*$/.test(rawTitle);

    const isbn = rest[rest.length - 1] || "";

    // Existing format:
    // Title | Author | Rating for XY | Rating for ZZ | ISBN
    const rating = rest.length >= 3 ? rest[rest.length - 3] : "";
    const ratingOther = rest.length >= 2 ? rest[rest.length - 2] : "";

    return {
      title,
      author,
      isbn,
      priority,
      rating,
      ratingOther,
      status: defaults.status || "",
      reader: defaults.reader || "Shared"
    };
  }

  function parseMarkdown(markdown) {
    const lines = markdown.split(/\r?\n/);
    const sections = [];
    let section = null;
    let book = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) continue;

      // A single # starts a new shelf/section.
      if (line.startsWith("# ")) {
        const title = line.slice(2).trim();

        section = {
          title,
          books: [],
          ...sectionDefaults(title)
        };

        sections.push(section);
        book = null;
        continue;
      }

      if (!section) continue;

      // ## Book Title | Author | ISBN
      // ## Book Title | Author | Rating | Rating | ISBN
      if (line.startsWith("## ")) {
        book = parseBookLine(line.slice(3).trim(), section);

        if (book) {
          section.books.push(book);
        }

        continue;
      }

      // Plain pipe-delimited books under "To read" sections.
      if (line.includes("|") && !line.startsWith("- ")) {
        book = parseBookLine(line, section);

        if (book) {
          section.books.push(book);
        }

        continue;
      }

      // Optional per-book overrides.
      // Example:
      // - reader: ZZ
      // - status: Currently Reading
      if (book && line.startsWith("- ")) {
        const match = line.slice(2).match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);

        if (match) {
          const [, key, value] = match;
          book[key] = value.trim();
        }
      }
    }

    return sections;
  }

  function coverURL(book) {
    if (!book.isbn) return "";

    const isbn = String(book.isbn).replace(/[^0-9Xx]/g, "");

    if (!isbn) return "";

    return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg?default=false`;
  }

  function card(book, shelfStatus) {
    const title = escapeHTML(book.title || "");
    const author = escapeHTML(book.author || "");
    const reader = escapeHTML(book.reader || "Shared");
    const src = escapeHTML(coverURL(book));
    const description = escapeHTML(book.description || "");
    const goodreads = escapeHTML(book.goodreads || "");

    const label =
      shelfStatus === "Currently Reading"
        ? `${reader} is reading`
        : `${reader}'s pick`;

    return `
      <article
        class="book-card current-reading-card reading-room-${
          shelfStatus === "Currently Reading" ? "current" : "next"
        }-card"
        data-reader="${reader}"
      >
        <div class="current-book-grid">
          <div class="cover-frame current-cover">
            ${
              src
                ? `<img
                    src="${src}"
                    alt="Cover of ${title} by ${author}"
                    loading="lazy"
                    onerror="this.style.display='none';this.parentElement.classList.add('is-fallback')"
                  >`
                : ""
            }
            <div class="fallback-cover" aria-hidden="true">
              Cover unavailable
            </div>
          </div>

          <div class="reading-room-copy">
            <span class="reader-badge mb-4 px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em]">
              ${label}
            </span>

            <h3 class="editorial-heading">${title}</h3>
            <p class="book-author">${author}</p>

            ${
              description
                ? `<p class="book-description">${description}</p>`
                : ""
            }

            ${
              goodreads
                ? `<a
                    class="focus-ring link-line"
                    href="${goodreads}"
                    rel="noopener noreferrer"
                    target="_blank"
                  >Find it on Goodreads</a>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  async function load() {
    try {
      const response = await fetch(root.dataset.readingRoomUrl, {
        headers: {
          Accept: "text/markdown,text/plain"
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const markdown = await response.text();
      const sections = parseMarkdown(markdown);

      const books = sections.flatMap((section) =>
        section.books.map((book) => ({
          ...book,
          section: section.title
        }))
      );

      const current = books.filter(
        (book) => book.status === "Currently Reading"
      );

      const next = books.filter(
        (book) => book.status === "Reading Next"
      );

      const currentList = document.querySelector("[data-reading-current]");
      const nextList = document.querySelector("[data-reading-next]");

      if (currentList) {
        currentList.innerHTML = current.length
          ? current
              .map((book) => card(book, "Currently Reading"))
              .join("")
          : `<p class="content-empty">
              No books are currently assigned to this shelf.
            </p>`;
      }

      if (nextList) {
        nextList.innerHTML = next.length
          ? next
              .map((book) => card(book, "Reading Next"))
              .join("")
          : `<p class="content-empty">
              No books are assigned to the Reading Next shelf.
            </p>`;
      }

      window.BookClubBooks = {
        sections,
        books,
        coverURL
      };

      document.dispatchEvent(
        new CustomEvent("bookclub:loaded", {
          detail: window.BookClubBooks
        })
      );
    } catch (error) {
      console.error("Reading room load failed", error);

      const currentList = document.querySelector("[data-reading-current]");
      const nextList = document.querySelector("[data-reading-next]");

      const message = `
        <p class="content-empty">
          The reading room could not be loaded.
        </p>
      `;

      if (currentList) currentList.innerHTML = message;
      if (nextList) nextList.innerHTML = message;
    }
  }

  load();
})();
