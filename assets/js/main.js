/* ==========================================================================
   حكاية خلية — shared interactions
   Theme (light/dark) · mobile menu · reveal · quiz
   ========================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------------- Theme ---------------- */
  const themeToggle = $("#theme-toggle");
  const STORAGE_KEY = "bee-story-theme-v2";

  function syncThemeButton() {
    if (!themeToggle) return;
    const isDark = root.dataset.theme === "dark";
    const label = isDark
      ? themeToggle.dataset.labelLight
      : themeToggle.dataset.labelDark;
    if (label) themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("aria-pressed", String(isDark));
    if (label) themeToggle.title = label;
  }
  syncThemeButton();

  themeToggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) { /* storage disabled */ }
    syncThemeButton();
  });

  /* ---------------- Mobile menu ---------------- */
  const nav = $("#primary-nav");
  const menuToggle = $("#menu-toggle");

  function closeMenu() {
    nav?.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }

  menuToggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  $$("a", nav || document.createElement("div")).forEach((link) =>
    link.addEventListener("click", closeMenu)
  );

  document.addEventListener("click", (event) => {
    if (!nav?.classList.contains("is-open")) return;
    if (!event.target.closest(".site-header")) closeMenu();
  });

  /* ---------------- Header shadow + back to top ---------------- */
  const header = $(".site-header");
  const toTop = $("#to-top");

  function onScroll() {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
    toTop?.classList.toggle("is-visible", window.scrollY > 420);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------------- Active navigation link ---------------- */
  const navLinks = $$('#primary-nav a[href^="#"]');
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) =>
            link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`)
          );
        });
      },
      { rootMargin: "-35% 0px -58% 0px", threshold: 0 }
    );
    sections.forEach((section) => activeObserver.observe(section));
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------------- Knowledge quiz ---------------- */
  const quizCards = $$(".quiz-card");
  if (quizCards.length) {
    const scoreEl = $("#quiz-score");
    const progressEl = $("#quiz-progress-fill");
    const finishEl = $("#quiz-finish");
    const finishScoreEl = $("#quiz-finish-score");
    const resetBtn = $("#quiz-reset");
    let score = 0;

    function updateProgress(answered) {
      const total = quizCards.length;
      if (scoreEl) scoreEl.textContent = `${score} / ${total}`;
      if (progressEl) progressEl.style.width = `${(answered / total) * 100}%`;
    }

    quizCards.forEach((card) => {
      const options = $$(".q-option", card);
      const feedback = $(".q-feedback", card);

      options.forEach((option) => {
        option.addEventListener("click", () => {
          if (card.dataset.answered === "true") return;
          card.dataset.answered = "true";

          const isCorrect = option.dataset.correct === "true";
          if (isCorrect) score += 1;

          options.forEach((btn) => { btn.disabled = true; });
          option.classList.add(isCorrect ? "is-correct" : "is-wrong");

          if (!isCorrect) {
            const correctOption = options.find((btn) => btn.dataset.correct === "true");
            correctOption?.classList.add("is-correct");
          }

          if (feedback) {
            feedback.textContent = isCorrect
              ? card.dataset.good
              : `${card.dataset.bad} ${card.dataset.answer || ""}`.trim();
            feedback.classList.add("is-visible", isCorrect ? "good" : "bad");
          }
        });
      });
    });

    updateProgress(0);

    /* Reveal the closing message once every question is answered */
    const answerButtons = $$(".q-option");
    answerButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const answered = quizCards.filter((card) => card.dataset.answered === "true").length;
        updateProgress(answered);
        if (answered === quizCards.length && finishEl) {
          if (finishScoreEl) finishScoreEl.textContent = `${score} / ${quizCards.length}`;
          finishEl.classList.add("is-visible");
          finishEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    });

    resetBtn?.addEventListener("click", () => {
      score = 0;
      quizCards.forEach((card) => {
        delete card.dataset.answered;
        $$(".q-option", card).forEach((btn) => {
          btn.disabled = false;
          btn.classList.remove("is-correct", "is-wrong");
        });
        const feedback = $(".q-feedback", card);
        if (feedback) {
          feedback.textContent = "";
          feedback.classList.remove("is-visible", "good", "bad");
        }
      });
      finishEl?.classList.remove("is-visible");
      updateProgress(0);
      $(".quiz-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();
