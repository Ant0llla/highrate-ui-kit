'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let data = JSON.parse($('menu-data').textContent);
  let category = 'all';
  let printState = null;
  const normalize = text => String(text ?? '').toLocaleLowerCase('ru').replace(/ё/g, 'е').trim();
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const match = (item, query) => normalize([item.name, item.description, ...(item.variants || [])].join(' ')).includes(query);
  function details(item) {
    const body = element('div', 'menu-item-body');
    body.append(element('h3', '', item.name));
    if (item.description) body.append(element('p', 'item-description', item.description));
    if (item.variants?.length) body.append(element('p', 'item-variants', item.variants.join(' · ')));
    if (item.ageRestriction) body.append(element('span', 'menu-age', `${item.ageRestriction}+`));
    // Only verified catalog values are displayed Historical metadata never enters the customer view
    if (item.portion !== null && item.portion !== undefined && String(item.portion).trim()) body.append(element('p', 'item-portion', item.portion));
    if (typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0) {
      body.append(element('p', 'item-price', new Intl.NumberFormat('ru-RU', { style: 'currency', currency: item.currency || 'RUB', maximumFractionDigits: 0 }).format(item.price)));
    }
    return body;
  }
  function card(item) {
    const node = element('article', item.image ? 'menu-dish' : 'menu-line-item');
    node.dataset.itemId = item.id;
    if (item.image) {
      const image = element('img', 'dish-photo');
      image.src = item.image;
      image.alt = item.name;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.width = 560;
      image.height = 560;
      node.append(image);
    }
    node.append(details(item));
    return node;
  }
  function render() {
    const query = normalize($('find').value);
    const shown = data.items.filter(item => (category === 'all' || item.category === category) && match(item, query));
    const fragment = document.createDocumentFragment();
    for (const group of data.categories) {
      const items = shown.filter(item => item.category === group.id);
      if (!items.length) continue;
      const section = element('section', `menu-section menu-section-${group.id}`);
      const heading = element('div', 'menu-section-heading');
      heading.append(element('h2', '', group.label), element('span', 'group-count', String(items.length).padStart(2, '0')));
      section.append(heading);
      const list = element('div', group.id === 'food' ? 'menu-food-grid' : 'menu-text-grid');
      items.forEach(item => list.append(card(item)));
      section.append(list);
      fragment.append(section);
    }
    $('catalog').replaceChildren(fragment);
    $('empty').hidden = shown.length !== 0;
    $('result-count').textContent = query ? `Найдено позиций: ${shown.length}` : `Позиций в каталоге: ${shown.length}`;
    document.querySelectorAll('[data-category]').forEach(button => {
      const selected = button.dataset.category === category;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  function setup() {
    $('catalog-note').textContent = data.notice;
    const controls = document.createDocumentFragment();
    for (const group of [{ id: 'all', label: 'Всё меню' }, ...data.categories]) {
      const button = element('button', '', group.label);
      button.type = 'button';
      button.dataset.category = group.id;
      button.addEventListener('click', () => { category = group.id; render(); });
      controls.append(button);
    }
    $('menu-controls').replaceChildren(controls);
    const exports = document.createDocumentFragment();
    for (const file of data.tvExports || []) {
      const anchor = element('a', '', `${file.label} ↗`);
      anchor.href = file.url;
      exports.append(anchor);
    }
    $('tv-downloads').replaceChildren(exports);
    render();
  }
  $('find').addEventListener('input', render);
  $('reset-search').addEventListener('click', () => { $('find').value = ''; category = 'all'; render(); $('find').focus(); });
  function preparePrint() {
    if (printState) return;
    printState = { category, query: $('find').value };
    category = 'all';
    $('find').value = '';
    render();
    document.querySelectorAll('.dish-photo').forEach(image => { image.loading = 'eager'; });
  }
  function restorePrint() {
    if (!printState) return;
    category = printState.category;
    $('find').value = printState.query;
    printState = null;
    render();
  }
  $('print-menu').addEventListener('click', async () => {
    preparePrint();
    const images = [...document.querySelectorAll('.dish-photo')];
    await Promise.allSettled(images.map(image => image.decode()));
    window.print();
  });
  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', restorePrint);
  setup();
  // HTTP reads the editable JSON directly file:// uses the embedded copy refreshed by menu-build.cjs
  if (location.protocol !== 'file:') {
    fetch('menu-data.json', { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error('Catalog unavailable');
      return response.json();
    }).then(next => {
      if (!Array.isArray(next.items) || !Array.isArray(next.categories)) throw new Error('Invalid catalog');
      data = next;
      setup();
    }).catch(() => { /* Keep the bundled catalog available if the JSON request fails */ });
  }
})();
