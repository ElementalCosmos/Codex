const sample = [
  {id:'a-plan-meets-real-life', title:'When the plan met real life', issue:'A plan meets real life', date:'2026-11-09', summary:'A group changed its plan after someone described a constraint the others had missed.', prompt:'Think of a plan that changed after somebody spoke up. What did you observe, and what did you infer?', comments:[{by:'Sample reader', body:'When I said what I could actually do that week, the group found a smaller first step.'}]},
  {id:'who-gets-to-decide', title:'Who gets to decide?', issue:'A plan meets real life', date:'2026-11-12', summary:'A project slowed down while people waited for someone else to make a decision.', prompt:'Where did you see responsibility sit in a group this week? What changed once it was named?', comments:[]},
  {id:'after-the-handoff', title:'What happened after the handoff?', issue:'Roles in practice', date:'2026-11-05', summary:'The work moved to a new person, but the context stayed with the old team.', prompt:'What did you learn from a handoff that went differently than expected?', comments:[]}
];

const offers = {
  project:['Project & team consulting','Start with a real project or organizational decision. An hourly session could help clarify who is involved, where work gets stuck, and one change your team can try. A follow-up could track what changed.'],
  personal:['Personal consultations','Bring a question about your life, relationships, or human needs. Use the hour to examine a specific situation and identify something you can observe or try afterward.'],
  classes:['Classes & digital products','Possible first releases include a short introduction to the Elemental Method, a reflection worksheet for the Weekly, and a team decision worksheet.']
};

const key = 'omni-cosmos-demo-v1';
const initial = {profiles:[], active:null, comments:{}, posts:{}, drafts:{}};
let state;
try { state = JSON.parse(localStorage.getItem(key)) || initial; }
catch { state = initial; }

const modal = document.querySelector('#modal');
const body = document.querySelector('#modal-body');
const account = document.querySelector('#account');
const search = document.querySelector('#search');
const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const active = () => state.profiles.find(profile => profile.id === state.active);
const date = value => new Intl.DateTimeFormat('en',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(value));
const postList = () => sample.map(post => ({...post,...state.posts[post.id]}));
const postFor = id => postList().find(post => post.id === id);
const count = post => post.comments.length + (state.comments[post.id] || []).length;

function save(next) {
  try {
    localStorage.setItem(key, JSON.stringify(next));
    state = next;
    return true;
  } catch {
    const status = $('dialog-status');
    if (status) status.textContent = 'Your browser could not save this change.';
    return false;
  }
}

function entry(post, archive = false) {
  const n = count(post);
  return `<a class="entry" href="#happening/${post.id}"><span><strong>${escape(post.title)}</strong><small>${archive ? escape(post.issue) + ' · ' : ''}${date(post.date)} · ${n} ${n === 1 ? 'comment' : 'comments'}</small></span><span class="entry-arrow" aria-hidden="true">↗</span></a>`;
}

function renderArchive() {
  const terms = search.value.trim().toLowerCase().split(/\s+/);
  const found = postList().filter(post => terms.every(term => [post.title,post.issue,post.summary,post.prompt].join(' ').toLowerCase().includes(term)));
  $('results').innerHTML = found.length ? found.map(post => entry(post, true)).join('') : '<p>No matching happenings.</p>';
}

function render() {
  account.textContent = active() ? 'Account' : 'Sign in';
  if (search) {
    $('weekly-entries').innerHTML = postList().slice(0,2).map(post => entry(post)).join('');
    renderArchive();
  }
}

function show(content, kind) {
  modal.dataset.kind = kind;
  body.innerHTML = content;
  if (!modal.open) modal.showModal();
  $('modal-title').focus();
}

const heading = title => `<h2 id="modal-title" tabindex="-1">${escape(title)}</h2>`;
const status = '<p id="dialog-status" role="status" class="hint"></p>';

function showAccount(returnTo) {
  const profile = active();
  if (profile) {
    show(heading('Your demo account') + `<p>Signed in as <strong>${escape(profile.name)}</strong> · ${profile.role === 'editor' ? 'Editor' : 'Member'}</p><p class="hint">Demo profiles, edits, and comments are stored in this browser.</p><button id="signout" class="outline">Sign out</button>` + status,'account');
    $('signout').onclick = () => {
      if (!save({...state,active:null})) return;
      render();
      if (returnTo) showPost(returnTo); else showAccount();
    };
    return;
  }

  show(heading('Try a demo account') + '<p class="hint">Create a local profile to comment, or try an editor profile to save drafts and publish edits in this browser.</p>' +
    (state.profiles.length ? '<form id="login"><label for="profile">Existing demo profile</label><select id="profile" name="profile">' + state.profiles.map(profile => `<option value="${profile.id}">${escape(profile.name)} · ${profile.role}</option>`).join('') + '</select><button class="outline">Sign in</button></form>' : '') +
    '<form id="signup"><label for="name">Display name</label><input id="name" name="name" required maxlength="40"><label for="role">Demo role</label><select id="role" name="role"><option value="member">Member</option><option value="editor">Editor</option></select><button class="primary">Create demo account</button></form>' + status,'account');
  function finish(next) {
    if (!save(next)) return;
    render();
    if (returnTo) showPost(returnTo); else showAccount();
  }
  if ($('login')) $('login').onsubmit = event => {
    event.preventDefault();
    finish({...state,active:$('profile').value});
  };
  $('signup').onsubmit = event => {
    event.preventDefault();
    const name = $('name').value.trim();
    if (!name) { $('dialog-status').textContent = 'Enter a display name.'; return; }
    const profile = {name, id:crypto.randomUUID(), role:$('role').value};
    finish({...state,profiles:[...state.profiles,profile],active:profile.id});
  };
}

function showPost(id) {
  const post = postFor(id);
  if (!post) return;
  const profile = active();
  const comments = [...post.comments,...(state.comments[id] || [])];
  const link = new URL('#happening/' + id, location.href).href;
  const share = 'https://x.com/intent/post?' + new URLSearchParams({text:post.title + ' — ' + post.summary,url:link});
  show(`<p class="kicker">${escape(post.issue)} · ${date(post.date)}</p>` + heading(post.title) +
    `<p>${escape(post.summary)}</p><p><strong>Discussion prompt</strong><br>${escape(post.prompt)}</p><div class="controls"><button class="outline" id="copy-link">Copy discussion link</button><a href="${escape(share)}" target="_blank" rel="noopener">Preview on X ↗</a>${profile?.role === 'editor' ? '<button class="text-button" id="edit-post">Edit happening</button>' : ''}</div>
    <h3 class="discussion-title">Discussion</h3>` +
    (comments.length ? comments.map(comment => `<div class="comment"><strong>${escape(comment.by)}</strong>${comment.date ? ` <small>${date(comment.date)}</small>` : ''}<p>${escape(comment.body)}</p></div>`).join('') : '<p>Be the first to comment.</p>') +
    (profile ? '<form id="comment-form"><label for="comment">What did you observe?</label><textarea id="comment" rows="3" required maxlength="1200"></textarea><button class="primary">Publish demo comment</button></form>' : '<button id="comment-signin" class="primary">Sign in to comment</button>') + status,'post');

  $('copy-link').onclick = async () => {
    try { await navigator.clipboard.writeText(link); $('dialog-status').textContent = 'Discussion link copied.'; }
    catch { $('dialog-status').textContent = link; }
  };
  if ($('comment-signin')) $('comment-signin').onclick = () => showAccount(id);
  if ($('edit-post')) $('edit-post').onclick = () => showEditor(id);
  if ($('comment-form')) $('comment-form').onsubmit = event => {
    event.preventDefault();
    const comment = $('comment').value.trim();
    if (!comment) { $('dialog-status').textContent = 'Enter a comment.'; return; }
    const next = {...state,comments:{...state.comments,[id]:[...(state.comments[id] || []),{by:profile.name,body:comment,date:new Date().toISOString()}]}};
    if (!save(next)) return;
    render();
    showPost(id);
    $('dialog-status').textContent = 'Demo comment published.';
  };
}

function showEditor(id) {
  if (active()?.role !== 'editor') return;
  const draft = state.drafts[id] || postFor(id);
  show(heading('Edit happening') + `<p class="hint">Drafts and published edits are local to this browser.</p><form id="edit-form">
    <label for="edit-title">Title</label><input id="edit-title" name="title" required maxlength="100" value="${escape(draft.title)}">
    <label for="edit-summary">Description</label><textarea id="edit-summary" name="summary" required maxlength="600">${escape(draft.summary)}</textarea>
    <label for="edit-prompt">Discussion prompt</label><textarea id="edit-prompt" name="prompt" required maxlength="600">${escape(draft.prompt)}</textarea>
    <div class="controls"><button class="outline" value="draft">Save draft</button><button class="primary" value="publish">Publish demo edit</button><button class="text-button" id="back" type="button">Back to discussion</button></div>
    </form>` + status,'edit');
  $('back').onclick = () => showPost(id);
  $('edit-form').onsubmit = event => {
    event.preventDefault();
    const fields = Object.fromEntries(Array.from(new FormData(event.currentTarget), ([name,value]) => [name,value.trim()]));
    if (Object.values(fields).some(value => !value)) { $('dialog-status').textContent = 'Complete all three fields.'; return; }
    if (event.submitter?.value !== 'publish') {
      if (save({...state,drafts:{...state.drafts,[id]:fields}})) $('dialog-status').textContent = 'Draft saved.';
      return;
    }
    const drafts = {...state.drafts};
    delete drafts[id];
    if (!save({...state,drafts,posts:{...state.posts,[id]:fields}})) return;
    render();
    showPost(id);
    $('dialog-status').textContent = 'Demo edit published.';
  };
}

function route() {
  if (!search && /^(#weekly$|#archive$|#happening\/)/.test(location.hash)) {
    location.replace('/cosmos/wiki/astrology/current-trends/' + location.hash);
    return;
  }
  const id = location.hash.split('/')[1];
  if (location.hash.startsWith('#happening/') && postFor(id)) showPost(id);
  else if (modal.open) modal.close();
}
$('close').onclick = () => modal.close();
modal.addEventListener('close', () => {
  if (location.hash.startsWith('#happening/')) history.replaceState(null,'','#weekly');
});
account.onclick = () => showAccount();
if (search) search.oninput = renderArchive;
document.querySelectorAll('[data-offer]').forEach(button => {
  button.onclick = () => {
    const [title,description] = offers[button.dataset.offer];
    show(heading(title) + `<p>${escape(description)}</p><p class="hint">Proposed offering. Booking and checkout will be added after launch details are set.</p>`,'offer');
  };
});
window.addEventListener('hashchange',route);
render();
route();
