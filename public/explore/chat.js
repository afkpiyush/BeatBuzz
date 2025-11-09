async function fetchJSON(url, options = {}) {
  const opts = { credentials: 'include', ...options };
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch {
    return '';
  }
}

let me = null;
let currentPeer = null;

async function loadMe() {
  try {
    const data = await fetchJSON('/api/user_profile');
    me = data;
    document.getElementById('me-username').textContent = `@${data.username}`;
    document.getElementById('me-fullname').textContent = data.full_name || '';
    document.getElementById('me-pic').src = data.profile_pic_url || (data.profile_pic ? `/uploads/${data.profile_pic}` : '/uploads/default.jpg');
  } catch (e) {
    console.error('Not logged in or unable to load profile:', e);
    const convList = document.getElementById('conv-list');
    convList.innerHTML = '<div style="color:#ccc">Please log in to use chat.</div>';
  }
}

async function loadConversations() {
  try {
    const convs = await fetchJSON('/api/chats');
    const list = document.getElementById('conv-list');
    list.innerHTML = '';
    convs.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'conv-item';
      item.dataset.username = conv.other_username;
      item.dataset.fullname = conv.full_name || '';

      const pic = document.createElement('img');
      pic.className = 'conv-pic';
      pic.src = conv.profile_pic_url || (conv.profile_pic ? `/uploads/${conv.profile_pic}` : '/uploads/default.jpg');

      const main = document.createElement('div');
      main.className = 'conv-main';
      const name = document.createElement('div');
      name.className = 'conv-name';
      name.textContent = conv.full_name ? `${conv.full_name} (@${conv.other_username})` : `@${conv.other_username}`;
      const last = document.createElement('div');
      last.className = 'conv-last';
      last.textContent = conv.last_text ? conv.last_text : '';
      const time = document.createElement('div');
      time.className = 'conv-time';
      time.textContent = conv.last_at ? fmtTime(conv.last_at) : '';

      main.appendChild(name);
      main.appendChild(last);
      main.appendChild(time);

      const unread = document.createElement('div');
      unread.className = 'conv-unread';
      unread.textContent = conv.unread_count > 0 ? conv.unread_count : '';

      item.appendChild(pic);
      item.appendChild(main);
      if (conv.unread_count > 0) item.appendChild(unread);

      item.addEventListener('click', () => openConversation(conv.other_username));
      list.appendChild(item);
    });

    // If URL has ?user=<username>, open it
    const params = new URLSearchParams(window.location.search);
    const peer = params.get('user');
    if (peer) openConversation(peer);

    // Also load contacts to start new conversations
    await loadContacts(convs.map(c => c.other_username));
    attachSearchFilter();
  } catch (e) {
    console.error('Error loading chats:', e);
    const list = document.getElementById('conv-list');
    list.innerHTML = '<div style="color:#ccc">Unable to load chats.</div>';
  }
}

async function loadContacts(existing = []) {
  const container = document.getElementById('contacts-list');
  if (!container) return;
  try {
    const profiles = await fetchJSON('/api/all_profiles');
    const existingSet = new Set(Array.isArray(existing) ? existing : []);
    container.innerHTML = '';
    if (!Array.isArray(profiles) || profiles.length === 0) {
      container.innerHTML = '<div style="color:#777">No users available.</div>';
      return;
    }
    profiles
      .filter(p => !existingSet.has(p.username))
      .forEach(profile => {
        const item = document.createElement('div');
        item.className = 'conv-item';
        item.dataset.username = profile.username;
        item.dataset.fullname = profile.full_name || '';

        const pic = document.createElement('img');
        pic.className = 'conv-pic';
        pic.src = profile.profile_pic ? `/uploads/${profile.profile_pic}` : '/uploads/default.jpg';
        pic.onerror = () => { pic.src = '/uploads/default.jpg'; };

        const main = document.createElement('div');
        main.className = 'conv-main';
        const name = document.createElement('div');
        name.className = 'conv-name';
        name.textContent = profile.full_name ? `${profile.full_name} (@${profile.username})` : `@${profile.username}`;
        const last = document.createElement('div');
        last.className = 'conv-last';
        last.textContent = 'Tap to start chat';
        main.appendChild(name);
        main.appendChild(last);

        item.appendChild(pic);
        item.appendChild(main);
        item.addEventListener('click', () => openConversation(profile.username));
        container.appendChild(item);
      });
    attachSearchFilter();
  } catch (e) {
    console.error('Error loading contacts:', e);
    container.innerHTML = '<div style="color:#ccc">Unable to load users. Please log in.</div>';
  }
}

function attachSearchFilter() {
  const input = document.getElementById('conv-search');
  if (!input) return;
  input.oninput = () => {
    const q = input.value.trim().toLowerCase();
    const items = Array.from(document.querySelectorAll('#conv-list .conv-item, #contacts-list .conv-item'));
    items.forEach(el => {
      const u = (el.dataset.username || '').toLowerCase();
      const f = (el.dataset.fullname || '').toLowerCase();
      el.style.display = (!q || u.includes(q) || f.includes(q)) ? '' : 'none';
    });
  };
}

async function openConversation(username) {
  currentPeer = username;
  // highlight
  document.querySelectorAll('.conv-item').forEach(i => {
    i.classList.toggle('active', i.dataset.username === username);
  });

  // load peer profile
  try {
    const prof = await fetchJSON(`/api/get_profile/${encodeURIComponent(username)}`);
    document.getElementById('peer-username').textContent = `@${prof.username}`;
    document.getElementById('peer-fullname').textContent = prof.full_name || '';
    document.getElementById('peer-pic').src = prof.profile_pic_url || (prof.profile_pic ? `/uploads/${prof.profile_pic}` : '/uploads/default.jpg');
  } catch (e) {
    console.warn('Peer profile not available:', e);
    document.getElementById('peer-username').textContent = `@${username}`;
    document.getElementById('peer-fullname').textContent = '';
    document.getElementById('peer-pic').src = '/uploads/default.jpg';
  }

  // load messages
  await loadMessages(username);
  // mark read
  try { await fetchJSON(`/api/messages/${encodeURIComponent(username)}/mark_read`, { method: 'POST' }); } catch {}
}

async function loadMessages(username) {
  const wrap = document.getElementById('messages');
  wrap.innerHTML = '';
  try {
    const msgs = await fetchJSON(`/api/messages/${encodeURIComponent(username)}`);
    msgs.forEach(m => {
      const b = document.createElement('div');
      b.className = 'bubble ' + (m.sender_username === me?.username ? 'me' : 'them');
      b.textContent = m.message_text;
      const t = document.createElement('div');
      t.className = 'timestamp';
      t.textContent = fmtTime(m.created_at);
      wrap.appendChild(b);
      wrap.appendChild(t);
    });
    wrap.scrollTop = wrap.scrollHeight;
  } catch (e) {
    console.error('Error loading messages:', e);
    wrap.innerHTML = '<div style="color:#ccc;padding:10px">Unable to load messages. Are you logged in?</div>';
  }
}

async function sendMessage(text) {
  if (!currentPeer) return;
  try {
    await fetchJSON(`/api/messages/${encodeURIComponent(currentPeer)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    // reload messages and conversations
    await loadMessages(currentPeer);
    await loadConversations();
  } catch (e) {
    console.error('Send message error:', e);
    alert('Failed to send message');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMe().then(() => {
    loadConversations();
  });

  const form = document.getElementById('send-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text) return;
    if (text.length > 1000) {
      alert('Message too long');
      return;
    }
    await sendMessage(text);
    input.value = '';
  });
});