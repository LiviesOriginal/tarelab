# Book Club for Two

A static/mobile-friendly reading-room site with a small Club Log workflow.

## Content source of truth

`content/books.md` is the single source of truth for the book lists:

- `# Currently Reading` — current books (to be added before deployment)
- `# Reading Next` — queued books (to be added before deployment)
- `# Read` — the Already Read archive, including ratings and notes
- `# To read - General`, `# To read - Sapphic`, `# To read - Thrillers`, `# To read - Classic`, etc. — On the Radar categories

The homepage, `/radar/`, `/already-read/`, and the Reading Room all fetch this same file. No separate Radar or Already Read content files are used.

## Covers and links

Book covers are fetched from OpenLibrary by ISBN. If OpenLibrary does not return a usable cover, the shared unavailable-cover asset is used. Goodreads links are generated from the ISBN unless an explicit `goodreads` field is added to a book entry.

## Notes for future books

The Reading Room supports book metadata beneath `##` entries, including `status`, `reader`, `description`, and `goodreads`. The top-level `Currently Reading` and `Reading Next` sections are also recognized directly, so those sections can be added to `books.md` before deployment.
