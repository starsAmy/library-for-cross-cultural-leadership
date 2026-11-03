(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Reveal page content as it enters the viewport.
  const revealItems = [...document.querySelectorAll("[data-reveal]")];

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
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

    revealItems.forEach((item, index) => {
      if (!item.style.getPropertyValue("--reveal-delay")) {
        const stagger = Math.min(index * 55, 330);
        item.style.setProperty("--reveal-delay", `${stagger}ms`);
      }
      revealObserver.observe(item);
    });
  }

  // Keep the homepage matrix feeling alive without distracting motion.
  const tiles = [...document.querySelectorAll(".book-tile")];
  if (!reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    tiles.forEach((tile) => {
      const motif = tile.querySelector(".tile-motif");
      if (!motif) return;

      tile.addEventListener("pointermove", (event) => {
        const bounds = tile.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        motif.style.transform = `translate(${x * -5}px, ${y * -4 + 2}px) scale(1.035)`;
      });

      tile.addEventListener("pointerleave", () => {
        motif.style.transform = "";
      });
    });
  }
})();
