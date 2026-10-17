'use strict';
(() => {
  const $ = s => document.querySelector(s);
  let data, index, children, selected = 'kit', section = 'kit';
  const safeLink = url => typeof url === 'string' && /^\.\.\/[a-zA-Z0-9_./#?=%-]+$/.test(url) && !url.includes('/../');
  const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
  function buttonFor(n, parent = false) {
    const b = element('button', undefined, parent ? 'parent-card' : 'node' + (n.id === selected ? ' selected' : ''));
    b.type = 'button'; b.dataset.node = n.id;
    if (parent) { b.append(element('span', data.types[n.type]), element('b', n.label)); }
    else {
      b.append(element('span', data.types[n.type], 'node-kind'), element('strong', n.label), element('small', n.summary || 'Открыть материал'));
      const count = children.get(n.id)?.length || 0;
      if (count) b.append(element('span', String(count), 'count'));
    }
    b.setAttribute('aria-label', n.label + ((children.get(n.id)?.length || 0) ? ' Раскрыть состав' : ' Показать материал'));
    b.onclick = () => { selected = n.id; if (children.get(n.id)?.length) { section = n.id; $('#search').value = ''; $('#type').value = ''; } inspect(n); render(); };
    return b;
  }
  function inspect(n) {
    $('#detail-type').textContent = data.types[n.type]; $('#detail-title').textContent = n.label; $('#detail-description').textContent = n.description || n.summary || '';
    const facts = $('#detail-facts'); facts.replaceChildren();
    if (n.facts?.length) { const group = element('div', undefined, 'facts'); n.facts.forEach(([k, v]) => { const line = element('div', undefined, 'fact'); line.append(element('span', k + ' '), document.createTextNode(v)); group.append(line); }); facts.append(group); }
    $('#detail-links').replaceChildren();
    for (const link of n.links || []) if (safeLink(link.href)) { const a = element('a', link.label + ' ↗'); a.href = link.href; $('#detail-links').append(a); }
    const related = data.edges.filter(e => e.source === n.id || e.target === n.id).slice(0, 10);
    $('#related').replaceChildren();
    if (related.length) {
      $('#related').append(element('h3', 'Проверенные связи'));
      for (const edge of related) {
        const other = index.get(edge.source === n.id ? edge.target : edge.source); if (!other) continue;
        const row = element('div', undefined, 'relation'), relation = data.relations[edge.relation];
        row.append(element('span', edge.source === n.id ? relation.label : relation.inverse));
        const b = element('button', other.label); b.type = 'button'; b.onclick = () => { selected = other.id; if (children.get(other.id)?.length) { section = other.id; $('#search').value = ''; $('#type').value = ''; } inspect(other); render(); }; row.append(b); $('#related').append(row);
      }
    }
  }
  function drawConnections() {
    const svg = $('#connections'); svg.replaceChildren();
    const parent = $('#parent-node .parent-card'); if (!parent) return;
    const diagram = $('#diagram').getBoundingClientRect(), p = parent.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${diagram.width} ${diagram.height}`);
    for (const node of $('#nodes').children) {
      const rect = node.getBoundingClientRect(), x1 = p.left + p.width / 2 - diagram.left, y1 = p.bottom - diagram.top, x2 = rect.left + rect.width / 2 - diagram.left, y2 = rect.top - diagram.top;
      const edge = document.createElementNS('http://www.w3.org/2000/svg', 'path'); edge.setAttribute('class', 'connection'); edge.setAttribute('d', `M${x1} ${y1} C${x1} ${y1+22} ${x2} ${y2-22} ${x2} ${y2}`); svg.append(edge);
    }
  }
  function render() {
    const query = $('#search').value.trim().toLocaleLowerCase('ru'), type = $('#type').value, filtering = Boolean(query || type);
    const parent = index.get(section) || index.get('kit');
    const visible = filtering ? data.nodes.filter(n => n.id !== 'kit' && (!type || n.type === type) && (!query || [n.label, n.summary, n.description].join(' ').toLocaleLowerCase('ru').includes(query))) : (children.get(parent.id) || []).map(id => index.get(id));
    $('#view-title').textContent = filtering ? 'Найденные материалы' : parent.id === 'kit' ? 'Обзор системы' : parent.label;
    $('#result-count').textContent = visible.length + ' ' + (filtering ? 'материалов' : 'узлов в разделе');
    $('#nodes').replaceChildren(...visible.map(n => buttonFor(n))); $('#parent-node').replaceChildren(...(filtering ? [] : [buttonFor(parent, true)]));
    $('#empty').hidden = visible.length !== 0;
    requestAnimationFrame(drawConnections);
  }
  async function load() {
    try {
      const response = await fetch('graph.json', { credentials: 'same-origin' }); if (!response.ok) throw Error('Граф не загрузился'); data = await response.json();
      index = new Map(data.nodes.map(n => [n.id, n])); children = new Map();
      for (const edge of data.edges) if (edge.relation === 'contains') { if (!children.has(edge.source)) children.set(edge.source, []); children.get(edge.source).push(edge.target); }
      for (const [key, label] of Object.entries(data.types)) { const option = element('option', label); option.value = key; $('#type').append(option); }
      for (const [number, label] of [[data.summary.components, 'семейств компонентов'], [data.summary.zones, 'зон'], [data.summary.seats, 'место'], [data.summary.menuItems, 'позиции меню'], [data.summary.photos, 'фотографии'], [data.summary.boards, 'досок'], [data.summary.wallpapers, 'фона'], [data.summary.creatives, 'креатива']]) { const stat = element('div', undefined, 'stat'); stat.append(element('b', number), element('span', label)); $('#stats').append(stat); }
      $('#search').oninput = render; $('#type').onchange = render; $('#overview').onclick = () => { section = selected = 'kit'; $('#search').value = ''; $('#type').value = ''; inspect(index.get('kit')); render(); };
      inspect(index.get('kit')); render(); new ResizeObserver(drawConnections).observe($('#diagram')); document.fonts.ready.then(drawConnections);
    } catch (error) { $('#view-title').textContent = 'Не удалось открыть граф'; $('#result-count').textContent = error.message; $('#detail-description').textContent = 'Обнови страницу или открой дизайн-кит по ссылке в шапке'; }
  }
  load();
})();
