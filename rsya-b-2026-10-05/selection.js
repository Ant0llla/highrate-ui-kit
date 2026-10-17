"use strict";

(() => {
  const creativeData = [
    { number: "07", title: "Из чата — в HIGHRATE" },
    { number: "08", title: "Пора сменить режим" },
    { number: "09", title: "Устройся как надо" },
    { number: "10", title: "Здесь твой вечер важен" },
    { number: "11", title: "Мощно + удобно" },
    { number: "12", title: "План на двоих" }
  ];
  const titles = new Map(creativeData.map(creative => [creative.number, creative.title]));
  const cards = [...document.querySelectorAll(".creative-card")];
  const checkboxes = [...document.querySelectorAll('input[name="creative"]')];
  const formatButtons = [...document.querySelectorAll("button[data-format]")];
  const selectionValue = document.querySelector("#selection-value");
  const selectionStatus = document.querySelector("#selection-status");
  const copyButton = document.querySelector("#copy-selection");
  const clearButton = document.querySelector("#clear-selection");
  const storageKey = "highrate-rsya-07-12-2026-10-05-selection";
  const formatStorageKey = "highrate-rsya-07-12-2026-10-05-format";
  const legacyStorageKey = "highrate-rsya-b-2026-10-05-selection";
  const legacyFormatStorageKey = "highrate-rsya-b-2026-10-05-format";
  const allowedNumbers = new Set(cards.map(card => card.dataset.number));
  const normalizeNumber = number => typeof number === "string" && /^B0[1-6]$/.test(number)
    ? String(Number(number.slice(1)) + 6).padStart(2, "0")
    : number;

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
    for (const card of cards) {
      card.classList.toggle("is-selected", selected.includes(card.dataset.number));
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(selected));
    } catch (_) {
      // Selection remains usable when storage is unavailable in a local file.
    }
  }

  function setFormat(format) {
    if (format !== "square" && format !== "wide") return;
    const width = format === "square" ? 1080 : 1920;
    document.body.dataset.format = format;
    for (const button of formatButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.format === format));
    }
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
    try {
      localStorage.setItem(formatStorageKey, format);
    } catch (_) {
      // Format switching remains usable without browser storage.
    }
  }

  for (const button of formatButtons) {
    button.addEventListener("click", () => setFormat(button.dataset.format));
  }
  for (const checkbox of checkboxes) {
    checkbox.addEventListener("change", updateSelection);
  }
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
        // Some browsers block clipboard access for files opened from disk.
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

  let restoredFormat = "square";
  try {
    const storedSelection = localStorage.getItem(storageKey) ?? localStorage.getItem(legacyStorageKey);
    const stored = JSON.parse(storedSelection || "[]");
    if (Array.isArray(stored)) {
      const selected = new Set(stored.map(normalizeNumber).filter(number => typeof number === "string" && allowedNumbers.has(number)));
      for (const checkbox of checkboxes) checkbox.checked = selected.has(checkbox.value);
    }
    const storedFormat = localStorage.getItem(formatStorageKey) ?? localStorage.getItem(legacyFormatStorageKey);
    if (storedFormat === "square" || storedFormat === "wide") restoredFormat = storedFormat;
  } catch (_) {
    // Start with default values when stored data is unavailable or invalid.
  }
  setFormat(restoredFormat);
  updateSelection();
})();
