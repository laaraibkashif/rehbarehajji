/**
 * TextSplitter — manual text-splitting utilities for reveal animations.
 *
 * Since GSAP's SplitText is a paid plugin, these helpers split text into
 * characters, words, and lines for use with staggered ScrollTrigger
 * reveals. Line detection uses a post-render measurement approach:
 * render words into a hidden element, measure offsetTop to group words
 * into visual lines.
 *
 * Usage:
 *   const chars = splitChars("Hello");     // [{ char: "H", key: "c-0" }, ...]
 *   const words = splitWords("Hello world"); // [{ word: "Hello", key: "w-0" }, ...]
 */

/**
 * Split a string into individual characters.
 * Whitespace is preserved as a space character entry.
 */
export function splitChars(text) {
  if (!text) return [];
  return Array.from(text).map((char, i) => ({
    char,
    key: `c-${i}`,
  }));
}

/**
 * Split a string into words, preserving whitespace as separate entries
 * so the rendered result flows naturally.
 */
export function splitWords(text) {
  if (!text) return [];
  // Split on word boundaries, keeping the separators
  const parts = text.split(/(\s+)/);
  return parts
    .filter((p) => p.length > 0)
    .map((part, i) => ({
      word: part,
      isSpace: /^\s+$/.test(part),
      key: `w-${i}`,
    }));
}

/**
 * After rendering word spans into a container, detect line breaks by
 * comparing each word span's `offsetTop`. Consecutive words with the
 * same offsetTop belong to the same visual line.
 *
 * @param {HTMLElement} container — the element containing word spans
 * @param {string} wordSelector — CSS selector for word spans (default "[data-word]")
 * @returns {Array<Array<HTMLElement>>} — array of lines, each an array of word elements
 */
export function detectLines(container, wordSelector = "[data-word]") {
  if (!container) return [];

  const wordEls = Array.from(container.querySelectorAll(wordSelector));
  if (wordEls.length === 0) return [];

  const lines = [];
  let currentLine = [wordEls[0]];

  for (let i = 1; i < wordEls.length; i++) {
    const prevTop = wordEls[i - 1].offsetTop;
    const currTop = wordEls[i].offsetTop;

    if (Math.abs(currTop - prevTop) > 2) {
      // New line
      lines.push(currentLine);
      currentLine = [wordEls[i]];
    } else {
      currentLine.push(wordEls[i]);
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Detect lines and wrap each line's words in a <span> for line-level
 * animation. Mutates the container's DOM.
 *
 * @param {HTMLElement} container
 * @param {string} wordSelector
 * @returns {Array<HTMLSpanElement>} — the created line-span elements
 */
export function wrapLines(container, wordSelector = "[data-word]") {
  const lines = detectLines(container, wordSelector);
  const lineSpans = [];

  lines.forEach((words) => {
    const span = document.createElement("span");
    span.className = "reveal-line";
    span.style.display = "block";
    words.forEach((w) => span.appendChild(w.cloneNode(true)));
    lineSpans.push(span);
  });

  // Replace content with line-wrapped version
  container.innerHTML = "";
  lineSpans.forEach((span) => container.appendChild(span));

  return lineSpans;
}
