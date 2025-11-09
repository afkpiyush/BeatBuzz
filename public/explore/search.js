const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");

// Store logged-in user data
let currentUser = null;

// Fetch logged-in user's profile for right-side panel and also store it
fetch("/api/user_profile", { method: "GET", credentials: "include" })
  .then(res => {
    if (!res.ok) throw new Error("Not logged in or profile not found");
    return res.json();
  })
  .then(data => {
    currentUser = data; // store current user

    // Update right-side panel
    document.querySelector(".your-name").textContent = data.full_name;
    document.querySelector(".your-zodiac").textContent = data.zodiac_sign || "♒";
    document.querySelector(".your-bio").textContent = data.bio || "No bio provided";

    const yourPic = document.querySelector(".your-pic");
    const src = data.profile_pic_url || (data.profile_pic && data.profile_pic.trim() !== "" ? `/uploads/${data.profile_pic}` : "/uploads/default.jpg");
    yourPic.src = src;
    yourPic.onerror = () => { yourPic.src = "/uploads/default.jpg"; };
  })
  .catch(err => {
    console.error("Error fetching profile:", err);
    document.querySelector(".your-name").textContent = "Guest User";
    document.querySelector(".your-pic").src = "/uploads/default.jpg";
  });

// Handle search input
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    resultsDiv.innerHTML = "";
    return;
  }

  fetch(`/api/search_users?query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      resultsDiv.innerHTML = "";

      // Include current user in results if query matches their name
      if (currentUser && currentUser.full_name.toLowerCase().includes(query)) {
        data.unshift(currentUser);
      }

      data.forEach(user => {
        const card = document.createElement("div");
        card.className = "profile-card";

        const img = document.createElement("img");
        img.className = "profile-pic";
        img.src = user.profile_pic_url || (user.profile_pic ? `/uploads/${user.profile_pic}` : "/uploads/default.jpg");
        img.onerror = () => { img.src = "/uploads/default.jpg"; };

        const name = document.createElement("div");
        name.className = "profile-name";
        name.textContent = user.full_name;

        const zodiac = document.createElement("div");
        zodiac.className = "profile-zodiac";
        zodiac.textContent = user.zodiac_sign || "♒";

        const bio = document.createElement("div");
        bio.className = "profile-bio";
        bio.textContent = user.bio || "No bio provided";

        // --- View Profile button ---
const viewBtn = document.createElement("button");
viewBtn.className = "view-btn";
viewBtn.textContent = "View Profile";
viewBtn.addEventListener("click", () => {
  window.location.href = `profile.html?username=${encodeURIComponent(user.username)}`;
});

// --- NEW Connect (Y) button ---
const connectBtn = document.createElement("button");
connectBtn.className = "connect-btn";
connectBtn.textContent = "Vibe";
connectBtn.addEventListener("click", () => {
  fetch("/api/send_vibe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ to_username: user.username })
  })
  .then(res => res.json())
  .then(resp => {
    if (resp.success) {
      alert(`You sent a vibe to ${user.full_name}`);
      connectBtn.textContent = "Sent ✅";
      connectBtn.disabled = true;
    } else {
      alert(resp.error || "Error sending request");
    }
  })
  .catch(err => console.error("Error sending vibe:", err));
});

// Append all
card.append(img, name, zodiac, bio, viewBtn, connectBtn);
resultsDiv.appendChild(card);

      });
    })
    .catch(err => console.error("Frontend search error:", err));
});
// Cleaned stray code: vibe status is handled per-result via send_vibe responses.
