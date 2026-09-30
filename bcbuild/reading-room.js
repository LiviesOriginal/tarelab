(() => {
  const root = document.querySelector("[data-reading-room-url]");
  if (!root) return;

  const NO_COVER_URL =
    "https://dryofg8nmyqjw.cloudfront.net/images/no-cover.png";

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  function cleanISBN(isbn) {
    return String(isbn || "").replace(/[^0-9Xx]/g, "");
  }

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

    /*
      Supported formats:

      Title | Author | ISBN

      Title | Author | Rating for XY | Rating for ZZ | ISBN
    */

    const isbn = rest[rest.length - 1] || "";
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

      /*
        A single # starts a new section.

        Examples:
        # Roxy's list (9/9/2026)
        # Read
        # To read - General
      */
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

      /*
        ## headings represent books in the Read section.

        Example:
        ## The Women | Kristen Hannah | 4 | 4 | 9781250178633
      */
      if (line.startsWith("## ")) {
        book = parseBookLine(line.slice(3).trim(), section);

        if (book) {
          section.books.push(book);
        }

        continue;
      }

      /*
        Plain pipe-delimited lines represent books in sections
        such as Roxy's list and To read.

        Example:
        The Invisible Life of Addie LaRue | V.E. Schwab | 9780765387578
      */
      if (line.includes("|") && !line.startsWith("- ")) {
        book = parseBookLine(line, section);

        if (book) {
          section.books.push(book);
        }

        continue;
      }

      /*
        Optional per-book overrides.

        Example:
        - reader: ZZ
        - status: Currently Reading
        - description: A short description
        - goodreads: https://www.goodreads.com/...
      */
      if (book && line.startsWith("- ")) {
        const match = line
          .slice(2)
          .match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);

        if (match) {
          const [, key, value] = match;
          book[key] = value.trim();
        }
      }
    }

    return sections;
  }

  function coverURL(isbn) {
    const clean = cleanISBN(isbn);

    if (!clean) {
      return NO_COVER_URL;
    }

    return `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(
      clean
    )}-M.jpg?default=false`;
  }

  function coverHTML(book) {
    const title = escapeHTML(book.title || "");
    const author = escapeHTML(book.author || "");
    const src = escapeHTML(coverURL(book.isbn));

    return `
      <img
        class="cover"
        src="${src}"
        alt="Cover of ${title} by ${author}"
        loading="lazy"
        onerror="
          this.onerror = null;
          this.src = '${NO_COVER_URL}';
          this.alt = 'No cover available';
        "
      >
    `;
  }

  function goodreadsURL(book) {
    const isbn = cleanISBN(book.isbn);

    if (!isbn) return "";

    return `https://www.goodreads.com/search?q=${encodeURIComponent(isbn)}`;
  }

  function card(book, shelfStatus) {
    const title = escapeHTML(book.title || "");
    const author = escapeHTML(book.author || "");
    const reader = escapeHTML(book.reader || "Shared");
    const description = escapeHTML(book.description || "");
    const goodreads = goodreadsURL(book);

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
            ${coverHTML(book)}
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
                ? `
                  <a
                    class="focus-ring link-line"
                    href="${goodreads}"
                    target="_blank"
                    rel="noopener"
                  >
                    Find it on Goodreads
                  </a>
                `
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  function renderEmpty(message) {
    return `
      <p class="content-empty">
        ${message}
      </p>
    `;
  }

  async function load() {
    try {
      const fileURL = root.dataset.readingRoomUrl;

      if (!fileURL) {
        throw new Error("No books.md path was provided.");
      }

      const response = await fetch(fileURL, {
        headers: {
          Accept: "text/markdown,text/plain"
        }
      });

      if (!response.ok) {
        throw new Error(`Could not load books.md: HTTP ${response.status}`);
      }

      const markdown = await response.text();

      if (!markdown.trim()) {
        throw new Error("books.md is empty.");
      }

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

      const currentList = document.querySelector(
        "[data-reading-current]"
      );

      const nextList = document.querySelector(
        "[data-reading-next]"
      );

      if (currentList) {
        currentList.innerHTML = current.length
          ? current
              .map((book) => card(book, "Currently Reading"))
              .join("")
          : renderEmpty(
              "No books are currently assigned to this shelf."
            );
      }

      if (nextList) {
        nextList.innerHTML = next.length
          ? next
              .map((book) => card(book, "Reading Next"))
              .join("")
          : renderEmpty(
              "No books are assigned to the Reading Next shelf."
            );
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

      console.log("Reading room loaded:", {
        sections,
        totalBooks: books.length,
        currentlyReading: current.length,
        readingNext: next.length
      });
    } catch (error) {
      console.error("Reading room load failed", error);

      const currentList = document.querySelector(
        "[data-reading-current]"
      );

      const nextList = document.querySelector(
        "[data-reading-next]"
      );

      const message = renderEmpty(
        "The reading room could not be loaded."
      );

      if (currentList) currentList.innerHTML = message;
      if (nextList) nextList.innerHTML = message;
    }
  }

  load();
})();
