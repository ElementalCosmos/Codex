const search = document.querySelector('#wiki-search');
const status = document.querySelector('#search-status');
const groups = Array.from(document.querySelectorAll('.wiki-group'));
search.addEventListener('input', () => {
  const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const group of groups) {
    let matches = 0;
    for (const entry of group.querySelectorAll('[data-entry]')) {
      entry.hidden = !terms.every(term => entry.textContent.toLowerCase().includes(term));
      if (!entry.hidden) matches++;
    }
    group.hidden = matches === 0;
    total += matches;
  }
  status.textContent = terms.length ? (total ? `${total} matching ${total === 1 ? 'entry' : 'entries'}.` : 'No matching entries.') : '';
});
