(() => {
  const form = document.getElementById("book-update-form");
  if (!form) return;

  const sectionSelect = document.getElementById("book-section");
  const message = document.getElementById("form-message");
  const turnstileState = document.getElementById("turnstile-state");
  const ratings = form.querySelector(".rating-fields");
  const submitButton = form.querySelector('button[type="submit"]');
  let turnstileToken = "";
  let turnstileWidgetId = null;
  let formReady = false;

  function sectionOptionLabel(section) {
    return /^next\s+syn(?:c|ch)\s+pick$/i.test(section.trim()) ? "Shared Reading" : section;
  }

  function setMessage(text, isError = false, link = "") {
    message.replaceChildren();
    message.className = `club-log-message ${isError ? "is-error" : "is-success"}`;
    if (!link) {
      message.textContent = text;
      return;
    }

    message.append(document.createTextNode(`${text} `));
    const anchor = document.createElement("a");
    anchor.href = link;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = "Review the pull request";
    message.append(anchor);
  }

  function setPending(pending) {
    submitButton.disabled = pending || !formReady;
    submitButton.setAttribute("aria-busy", String(pending));
  }

  function updateRatingVisibility() {
    const showRatings = sectionSelect.value.trim().toLowerCase() === "read";
    ratings.hidden = !showRatings;
    ratings.querySelectorAll("input").forEach((input) => {
      input.disabled = !showRatings;
      if (!showRatings) input.value = "";
    });
  }

  async function loadSections() {
    const response = await fetch("./content/books.md", {
      headers: { Accept: "text/markdown,text/plain" }
    });
    if (!response.ok) throw new Error(`Could not load book sections: HTTP ${response.status}`);
    const markdown = await response.text();
    const sections = markdown
      .split(/\r?\n/)
      .filter((line) => line.startsWith("# "))
      .map((line) => line.slice(2).trim());
    if (!sections.length) throw new Error("No sections were found in books.md.");

    sectionSelect.replaceChildren(new Option("Select", ""));
    sections.forEach((section) => sectionSelect.add(new Option(sectionOptionLabel(section), section)));
    sectionSelect.disabled = false;
    updateRatingVisibility();
  }

  function loadTurnstileScript() {
    if (window.turnstile) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-turnstile-api]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", () => reject(new Error("Could not load the spam protection.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.turnstileApi = "true";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Could not load the spam protection."));
      document.head.append(script);
    });
  }

  async function configureTurnstile() {
    const response = await fetch("/api/book-submission-config", {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Could not load form configuration: HTTP ${response.status}`);
    const config = await response.json();
    if (!config.siteKey) throw new Error("Turnstile is not configured for submissions yet.");
    await loadTurnstileScript();
    turnstileWidgetId = window.turnstile.render("#turnstile-widget", {
      sitekey: config.siteKey,
      callback: (token) => { turnstileToken = token; },
      "expired-callback": () => { turnstileToken = ""; },
      "error-callback": () => { turnstileToken = ""; }
    });
    turnstileState.textContent = "";
  }

  function resetTurnstile() {
    turnstileToken = "";
    if (turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
  }

  sectionSelect.disabled = true;
  submitButton.disabled = true;
  sectionSelect.addEventListener("change", updateRatingVisibility);
  Promise.all([loadSections(), configureTurnstile()])
    .then(() => {
      formReady = true;
      setPending(false);
    })
    .catch((error) => {
      console.error("Book update form setup failed", error);
      turnstileState.textContent = "Submissions are temporarily unavailable. Please try again later.";
      turnstileState.classList.add("is-error");
    });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const formData = new FormData(form);
    if (String(formData.get("website") || "").trim()) return;
    if (!turnstileToken) {
      setMessage("Complete the anti-spam check before submitting.", true);
      return;
    }

    const numberOrNull = (field) => {
      const value = String(formData.get(field) || "").trim();
      return value ? Number(value) : null;
    };
    const submission = {
      website: "",
      title: String(formData.get("book_title") || "").trim(),
      author: String(formData.get("author") || "").trim(),
      section: String(formData.get("section") || "").trim(),
      isbn: String(formData.get("isbn") || "").trim(),
      reflection: String(formData.get("reflection") || "").trim(),
      rating_xy: numberOrNull("rating_xy"),
      rating_zz: numberOrNull("rating_zz"),
      turnstile_token: turnstileToken
    };

    setPending(true);
    setMessage("Submitting your update…");
    try {
      const response = await fetch("/api/book-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(submission)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Submission failed: HTTP ${response.status}`);
      form.reset();
      updateRatingVisibility();
      resetTurnstile();
      setMessage("Your update is ready for review.", false, result.html_url);
    } catch (error) {
      console.error("Book update submission failed", error);
      setMessage(error.message || "Could not submit the update. Please try again.", true);
      resetTurnstile();
    } finally {
      setPending(false);
    }
  });
})();
