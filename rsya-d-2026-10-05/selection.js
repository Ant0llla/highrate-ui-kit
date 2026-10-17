"use strict";

(() => {
  const creativeData = [
    { number: "19", title: "Знак твоей игры" },
    { number: "20", title: "У HIGHRATE свой свет" },
    { number: "21", title: "Комфорт с характером HIGHRATE" },
    { number: "22", title: "Игра найдёт своё место" },
    { number: "23", title: "HIGHRATE в твоём ритме" },
    { number: "24", title: "HIGHRATE на Парашютной" }
  ];
  const titles = new Map(creativeData.map(creative => [creative.number, creative.title]));
  const cards = [...document.querySelectorAll(".creative-card")];
  const checkboxes = [...document.querySelectorAll('input[name="creative"]')];
  const formatButtons = [...document.querySelectorAll("button[data-format]")];
  const selectionValue = document.querySelector("#selection-value");
  const selectionStatus = document.querySelector("#selection-status");
  const copyButton = document.querySelector("#copy-selection");
  const clearButton = document.querySelector("#clear-selection");
  const themeButton = document.querySelector("#theme-toggle");
  const storageKey = "HIGHRATE-rsya-19-24";
  const formatStorageKey = `${storageKey}-format`;
  const themeStorageKey = `${storageKey}-theme`;
  const allowedNumbers = new Set(cards.map(card => card.dataset.number));

  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      // Controls remain usable when browser storage is unavailable.
    }
  }

  for (const card of cards) {
    const title = titles.get(card.dataset.number);
    if (!title) continue;
    card.querySelector("h2").textContent = title;
    card.querySelector("img").alt = `Креатив ${card.dataset.number} — ${title}`;
  }

  function updateSelection() {
    const selected = checkboxes.filter(input => input.checked).map(input => input.value);
    selectionValue.value = selected.join(", ");
    copyButton.disabled = selected.length === 0;
    clearButton.disabled = selected.length === 0;
    selectionStatus.textContent = selected.length ? `Выбрано ${selected.length} из 6` : "Отметь понравившиеся номера";
    for (const card of cards) card.classList.toggle("is-selected", selected.includes(card.dataset.number));
    writeStorage(storageKey, JSON.stringify(selected));
  }

  function setFormat(format) {
    if (format !== "square" && format !== "wide") return;
    const width = format === "square" ? 1080 : 1920;
    document.body.dataset.format = format;
    for (const button of formatButtons) button.setAttribute("aria-pressed", String(button.dataset.format === format));
    for (const card of cards) {
      const stem = `RSYA-${card.dataset.number}-${format}`;
      const imagePath = `assets/${stem}.jpg`;
      const image = card.querySelector("img");
      image.src = imagePath;
      image.width = width;
      image.height = 1080;
      card.querySelector(".image-link").href = imagePath;
      const jpgDownload = card.querySelector(".download-jpg");
      jpgDownload.href = imagePath;
      jpgDownload.download = `${stem}.jpg`;
      const pngDownload = card.querySelector(".download-png");
      pngDownload.href = `exports/${stem}.png`;
      pngDownload.download = `${stem}.png`;
      card.querySelector(".image-size").textContent = `${width} × 1080`;
    }
    writeStorage(formatStorageKey, format);
  }

  function setTheme(theme) {
    if (theme !== "light" && theme !== "dark") return;
    document.body.dataset.theme = theme;
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    themeButton.textContent = theme === "dark" ? "Светлая тема" : "Тёмная тема";
    writeStorage(themeStorageKey, theme);
  }

  for (const button of formatButtons) button.addEventListener("click", () => setFormat(button.dataset.format));
  for (const checkbox of checkboxes) checkbox.addEventListener("change", updateSelection);
  themeButton.addEventListener("click", () => setTheme(document.body.dataset.theme === "dark" ? "light" : "dark"));
  clearButton.addEventListener("click", () => {
    for (const checkbox of checkboxes) checkbox.checked = false;
    updateSelection();
  });
  copyButton.addEventListener("click", async () => {
    if (!selectionValue.value) return;
    const selectedText = selectionValue.value;
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(selectedText);
        copied = true;
      } catch (_) {
        // Files opened from disk may not have clipboard permission.
      }
    }
    if (!copied) {
      selectionValue.focus();
      selectionValue.select();
      try {
        copied = document.execCommand("copy");
      } catch (_) {
        copied = false;
      }
    }
    selectionStatus.textContent = copied ? `Скопированы номера ${selectedText}` : "Номера выделены — скопируй их сочетанием Ctrl+C";
  });

  try {
    const stored = JSON.parse(readStorage(storageKey) || "[]");
    if (Array.isArray(stored)) {
      const selected = new Set(stored.filter(number => typeof number === "string" && allowedNumbers.has(number)));
      for (const checkbox of checkboxes) checkbox.checked = selected.has(checkbox.value);
    }
  } catch (_) {
    // Ignore damaged selection data without losing the format or theme.
  }
  setFormat(readStorage(formatStorageKey) === "wide" ? "wide" : "square");
  setTheme(readStorage(themeStorageKey) === "dark" ? "dark" : "light");
  updateSelection();
})();
