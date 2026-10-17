"use strict";

(() => {
  const creativeData = [
    { number: "13", title: "Твоё место силы", support: "Комфортный компьютерный клуб для твоей игры" },
    { number: "14", title: "Играй с размахом", support: "Сильный сетап для твоих игровых планов" },
    { number: "15", title: "Комфорт в каждой детали", support: "Удобные места и внимание к твоему вечеру" },
    { number: "16", title: "Игра заслуживает сцену", support: "HIGHRATE — сильный сетап и комфорт" },
    { number: "17", title: "Точность начинается здесь", support: "Выбери конфигурацию под свою игру" },
    { number: "18", title: "Вечер под хорошим знаком", support: "Комфорт и сервис высокого уровня в HIGHRATE" }
  ];
  const titles = new Map(creativeData.map(creative => [creative.number, creative.title]));
  const cards = [...document.querySelectorAll(".creative-card")];
  const checkboxes = [...document.querySelectorAll('input[name="creative"]')];
  const formatButtons = [...document.querySelectorAll("button[data-format]")];
  const selectionValue = document.querySelector("#selection-value");
  const selectionStatus = document.querySelector("#selection-status");
  const copyButton = document.querySelector("#copy-selection");
  const clearButton = document.querySelector("#clear-selection");
  const storageKey = "highrate-rsya-c-2026-10-05-selection";
  const formatStorageKey = "highrate-rsya-c-2026-10-05-format";
  const allowedNumbers = new Set(cards.map(card => card.dataset.number));

  for (const card of cards) {
    const title = titles.get(card.dataset.number);
    if (!title) continue;
    card.querySelector("h2").textContent = title;
    const support = card.querySelector(".creative-support");
    if (support) support.textContent = creativeData.find(creative => creative.number === card.dataset.number).support;
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
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(stored)) {
      const selected = new Set(stored.filter(number => typeof number === "string" && allowedNumbers.has(number)));
      for (const checkbox of checkboxes) checkbox.checked = selected.has(checkbox.value);
    }
    const storedFormat = localStorage.getItem(formatStorageKey);
    if (storedFormat === "square" || storedFormat === "wide") restoredFormat = storedFormat;
  } catch (_) {
    // Start with default values when stored data is unavailable or invalid.
  }
  setFormat(restoredFormat);
  updateSelection();
})();
