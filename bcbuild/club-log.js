(() => {
  const API_URL = "/api/club-log";
  let records = [];
  let hasLoaded = false;
  const $ = (id) => document.getElementById(id);

  function setMessage(message, isError = false) {
    const el = $("form-message");
    if (!el) return;
    el.textContent = message;
    el.className = `text-sm ${isError ? "text-[#b64935]" : "text-[#44665a]"}`;
  }

  function setPending(button, pending) {
    button.disabled = pending;
    button.style.opacity = pending ? ".65" : "1";
    button.setAttribute("aria-busy", String(pending));
  }

  function showLoadError() {
    $("loading-state")?.classList.add("hidden");
    $("load-error")?.classList.remove("hidden");
  }

  function render(entries) {
    hasLoaded = true;
    $("loading-state")?.classList.add("hidden");
    $("load-error")?.classList.add("hidden");
    const list = $("saved-list");
    const empty = $("empty-state");
    const count = $("record-count");
    if (!list || !empty || !count) return;
    list.innerHTML = "";
    count.textContent = entries.length ? `${entries.length} ${entries.length === 1 ? "saved entry" : "saved entries"}` : "";
    empty.classList.toggle("hidden", entries.length !== 0);

    entries.slice().sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).forEach((record) => {
      const fragment = $("saved-entry-template").content.cloneNode(true);
      const row = fragment.querySelector("article");
      row.dataset.recordId = record.id;
      row.querySelector(".saved-status").textContent = record.status || "Club note";
      row.querySelector(".saved-title").textContent = record.book_title || "Untitled";
      row.querySelector(".saved-author").textContent = record.author || "";
      row.querySelector(".saved-meta").textContent = [record.reader, record.rating !== null && record.rating !== undefined && record.rating !== "" ? `${record.rating} / 5` : ""].filter(Boolean).join(" · ");
      const notes = row.querySelector(".saved-notes"); notes.textContent = record.notes || ""; notes.hidden = !record.notes;
      const quote = row.querySelector(".saved-quote"); quote.textContent = record.quote ? `“${record.quote}”` : ""; quote.hidden = !record.quote;
      const reflection = row.querySelector(".saved-reflection"); reflection.textContent = record.reflection || ""; reflection.hidden = !record.reflection;
      list.appendChild(fragment);
    });
  }

  async function loadClubLog() {
    $("load-error")?.classList.add("hidden");
    if (!hasLoaded) $("loading-state")?.classList.remove("hidden");
    try {
      const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`GET ${response.status}`);
      records = await response.json();
      render(records);
    } catch (error) {
      console.error("Club Log load failed", error);
      showLoadError();
    }
  }

  async function saveClubLogEntry(entry) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(entry)
    });
    let payload = null;
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(payload?.error || `POST ${response.status}`);
    return payload;
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".reader-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const filter = tab.dataset.filter;
        document.querySelectorAll(".reader-tab").forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
        document.querySelectorAll(".book-card[data-reader]").forEach((card) => card.classList.toggle("is-filtered", filter !== "all" && card.dataset.reader !== filter));
      });
    });

    document.querySelectorAll(".cover-frame img").forEach((image) => {
      image.addEventListener("error", () => image.closest(".cover-frame")?.classList.add("is-fallback"));
      image.addEventListener("load", () => image.closest(".cover-frame")?.classList.remove("is-fallback"));
    });

    $("retry-button")?.addEventListener("click", loadClubLog);

    $("club-log-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitButton = form.querySelector('button[type="submit"]');
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const formData = new FormData(form);
      if (String(formData.get("website") || "").trim()) { setMessage("Could not save this entry.", true); return; }
      const ratingValue = String(formData.get("rating") || "").trim();
      const entry = {
        book_title: String(formData.get("book_title") || "").trim(),
        author: String(formData.get("author") || "").trim(),
        status: formData.get("status"), reader: formData.get("reader"),
        notes: String(formData.get("notes") || "").trim(),
        rating: ratingValue === "" ? null : Number(ratingValue),
        quote: String(formData.get("quote") || "").trim(),
        reflection: String(formData.get("reflection") || "").trim()
      };
      setPending(submitButton, true); setMessage("");
      try {
        const saved = await saveClubLogEntry(entry);
        records = [saved, ...records];
        form.reset(); render(records); setMessage("Saved to your club log.");
      } catch (error) {
        console.error("Club Log save failed", error);
        setMessage(error.message || "Could not save the entry. Try again.", true);
      } finally { setPending(submitButton, false); }
    });

    loadClubLog();
  });
})();
