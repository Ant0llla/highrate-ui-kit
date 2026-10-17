"use strict";

(() => {
  const cards = [...document.querySelectorAll(".creative-card")];
  const checkboxes = [...document.querySelectorAll('input[name="creative"]')];
  const formatButtons = [...document.querySelectorAll("button[data-format]")];
  const selectionValue = document.querySelector("#selection-value");
  const selectionStatus = document.querySelector("#selection-status");
  const copyButton = document.querySelector("#copy-selection");
  const clearButton = document.querySelector("#clear-selection");
  const storageKey = "highrate-rsya-2026-10-05-selection";
  const allowedNumbers = new Set(cards.map(card => card.dataset.number));

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
      const fileName = `RSYA-${card.dataset.number}-${format}.jpg`;
      const imagePath = `assets/${fileName}`;
      const image = card.querySelector("img");
      image.src = imagePath;
      image.width = width;
      image.height = 1080;
      card.querySelector(".image-link").href = imagePath;
      const download = card.querySelector(".download-link");
      download.href = imagePath;
      download.download = fileName;
      card.querySelector(".image-size").textContent = `${width} × 1080`;
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

  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(stored)) {
      const selected = new Set(stored.filter(number => typeof number === "string" && allowedNumbers.has(number)));
      for (const checkbox of checkboxes) checkbox.checked = selected.has(checkbox.value);
    }
  } catch (_) {
    // Start with an empty selection when stored data is unavailable or invalid.
  }
  updateSelection();
})();
