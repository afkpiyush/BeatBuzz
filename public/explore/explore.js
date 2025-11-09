document.addEventListener("DOMContentLoaded", () => {

  let currentUser = ""; // use let so we can assign later

  // Smooth page transition
  document.querySelector('.center-feed')?.classList.add('fade-in');
  document.querySelector('.profile-panel')?.classList.add('fade-in');

  // Fetch logged-in user's profile for right-side panel
  fetch("/api/user_profile", { method: "GET", credentials: "include" })
    .then(res => res.json())
    .then(data => {
      currentUser = data.username; // store username for vibe checks

      const nameEl = document.querySelector(".your-name");
      const zodiacEl = document.querySelector(".your-zodiac");
      const bioEl = document.querySelector(".your-bio");
      const picEl = document.querySelector(".your-pic");

      if (nameEl) nameEl.textContent = data.full_name;
      if (zodiacEl) zodiacEl.textContent = data.zodiac_sign || "♒";
      if (bioEl) bioEl.textContent = data.bio || "No bio provided";
      if (picEl) {
        const src = data.profile_pic_url || (data.profile_pic && data.profile_pic.trim() !== "" ? `/uploads/${data.profile_pic}` : "/uploads/default.jpg");
        picEl.src = src;
        picEl.onerror = () => { picEl.src = "/uploads/default.jpg"; };
      }
    })
    .catch(err => {
      console.error("Error fetching profile:", err);
      const nameEl = document.querySelector(".your-name");
      const picEl = document.querySelector(".your-pic");
      if (nameEl) nameEl.textContent = "Guest User";
      if (picEl) picEl.src = "/uploads/default.jpg";
    });

  // Fetch all profiles except logged-in user
  fetch("/api/all_profiles", { method: "GET", credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error("Unable to load profiles");
      return res.json();
    })
    .then(profiles => {
      const container = document.querySelector(".profile-cards");
      container.innerHTML = "";

      if (!Array.isArray(profiles)) {
        container.innerHTML = "<p>Unable to load profiles. Please log in.</p>";
        return;
      }

      if (profiles.length === 0) {
        container.innerHTML = "<p>No profiles found yet.</p>";
        return;
      }

      profiles.forEach(profile => {
        const card = document.createElement("div");
        card.className = "profile-card";

        const img = document.createElement("img");
        img.className = "profile-pic";
        img.src = profile.profile_pic_url || (profile.profile_pic ? `/uploads/${profile.profile_pic}` : "/uploads/default.jpg");
        img.onerror = () => { img.src = "/uploads/default.jpg"; };

        const name = document.createElement("div");
        name.className = "profile-name";
        name.textContent = profile.full_name; // use full_name

        const zodiac = document.createElement("div");
        zodiac.className = "profile-zodiac";
        zodiac.textContent = profile.zodiac_sign || "♒";

        const bio = document.createElement("div");
        bio.className = "profile-bio";
        bio.textContent = profile.bio || "No bio provided";

        const btn = document.createElement("button");
        btn.className = "view-btn";

        // Check vibe/follow status dynamically
        fetch(`/api/vibe_status/${encodeURIComponent(profile.username)}`, { credentials: "include" })
          .then(res => res.json())
          .then(statusData => {
            if(statusData.status === "accepted") {
              btn.textContent = "Vibing";
              btn.disabled = true;
            } else if(statusData.status === "pending") {
              btn.textContent = "Vibe Sent";
              btn.disabled = true;
            } else {
              btn.textContent = "Vibe";
              btn.disabled = false;
              btn.addEventListener("click", () => sendVibe(profile.username, btn));
            }
          })
          .catch(err => {
            console.error("Error fetching vibe status:", err);
            btn.textContent = "Vibe";
            btn.disabled = false;
            btn.addEventListener("click", () => sendVibe(profile.username, btn));
          });

        card.append(img, name, zodiac, bio, btn);
        container.appendChild(card);
      });

      // Populate right-panel suggestions (top 5)
      try {
        const followBody = document.querySelector('.widget-follow .widget-body');
        if (followBody) {
          followBody.innerHTML = '';
          profiles.slice(0,5).forEach(p => {
            const row = document.createElement('div');
            row.className = 'widget-row';

            const ava = document.createElement('img');
            ava.className = 'avatar';
            ava.src = p.profile_pic_url || (p.profile_pic ? `/uploads/${p.profile_pic}` : '/uploads/default.jpg');
            ava.onerror = () => { ava.src = '/uploads/default.jpg'; };

            const nm = document.createElement('div');
            nm.className = 'name';
            nm.textContent = p.full_name;

            const action = document.createElement('div');

            fetch(`/api/vibe_status/${encodeURIComponent(p.username)}`, { credentials: 'include' })
              .then(r => r.json())
              .then(st => {
                if (st.status === 'accepted') {
                  const b = document.createElement('span');
                  b.className = 'followed-badge';
                  b.textContent = 'Followed';
                  action.appendChild(b);
                } else if (st.status === 'pending') {
                  const b = document.createElement('span');
                  b.className = 'pending-badge';
                  b.textContent = 'Requested';
                  action.appendChild(b);
                } else {
                  const btn = document.createElement('button');
                  btn.className = 'follow-btn';
                  btn.textContent = 'Follow';
                  btn.addEventListener('click', () => sendVibe(p.username, btn));
                  action.appendChild(btn);
                }
              })
              .catch(() => {
                const btn = document.createElement('button');
                btn.className = 'follow-btn';
                btn.textContent = 'Follow';
                btn.addEventListener('click', () => sendVibe(p.username, btn));
                action.appendChild(btn);
              });

            row.append(ava, nm, action);
            followBody.appendChild(row);
          });
        }
      } catch (e) { console.warn('Follow widget render failed:', e); }
    })
    .catch(err => console.error("Error fetching all profiles:", err));

  // Function to send vibe request
  function sendVibe(toUsername, btn) {
    fetch("/api/send_vibe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ to_username: toUsername })
    })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      if(data.success) {
        btn.textContent = "Vibe Sent";
        btn.disabled = true;
      }
    })
    .catch(err => console.error("Error sending vibe:", err));
  }

  // Populate Saved widget from liked posts
  fetch('/api/posts', { credentials: 'include' })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Posts load failed')))
    .then(posts => {
      const grid = document.querySelector('.widget-saved .saved-grid');
      if (!grid) return;
      grid.innerHTML = '';
      const saved = posts.filter(p => p.liked_by_me === 1).slice(0,4);
      if (saved.length === 0) {
        grid.innerHTML = '<div class="empty-state">No saved posts yet.</div>';
        return;
      }
      saved.forEach(p => {
        const t = document.createElement('div');
        t.className = 'thumb';
        const img = document.createElement('img');
        img.src = p.image_url || `/uploads/${p.image_filename}`; // prefer cloud URL, fallback to local
        img.alt = p.caption || 'Saved post';
        img.onerror = () => { img.remove(); };
        t.appendChild(img);
        grid.appendChild(t);
      });
    })
    .catch(err => console.error('Saved widget error:', err));

  // Populate Activity widget (full history)
  fetch('/api/notifications_history', { credentials: 'include' })
    .then(res => res.ok ? res.json() : Promise.reject(new Error('Notifications load failed')))
    .then(rows => {
      const list = document.querySelector('.widget-activity .activity-list');
      if (!list) return;
      list.innerHTML = '';
      rows.slice(0,5).forEach(n => {
        const li = document.createElement('li');
        li.className = 'activity-item';
        const text = document.createElement('div');
        text.className = 'text';
        text.textContent = n.message || `${n.actor} ${n.type}`;
        const time = document.createElement('div');
        time.className = 'time';
        try { time.textContent = new Date(n.created_at).toLocaleString(); } catch { time.textContent = ''; }
        li.append(text, time);
        list.appendChild(li);
      });
      if (list.children.length === 0) {
        list.innerHTML = '<li class="activity-item"><div class="text">No recent activity</div></li>';
      }
    })
    .catch(err => console.error('Activity widget error:', err));

});
