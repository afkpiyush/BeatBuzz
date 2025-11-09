const notificationList = document.getElementById("notification-list");

// Fetch notifications for logged-in user
fetch("/api/get_notifications", { credentials: "include" })
  .then(res => res.json())
  .then(notifications => {
    notificationList.innerHTML = "";

    if (notifications.length === 0) {
      notificationList.innerHTML = "<p>No notifications yet.</p>";
      return;
    }

    notifications.forEach(n => {
      const card = document.createElement("div");
      card.className = "notification-card";
      card.dataset.id = String(n.id);

      const text = document.createElement("div");
      text.className = "notification-text";
      text.textContent = n.message;

      card.appendChild(text);

      // If it's a vibe request, add Accept/Reject buttons
      if (n.type === "vibe") {
        const btnGroup = document.createElement("div");
        btnGroup.className = "action-buttons";

        const acceptBtn = document.createElement("button");
        acceptBtn.className = "accept-btn";
        acceptBtn.textContent = "Accept";
        acceptBtn.addEventListener("click", () => handleVibeAction(n.id, "accept", n.actor));

        const rejectBtn = document.createElement("button");
        rejectBtn.className = "reject-btn";
        rejectBtn.textContent = "Reject";
        rejectBtn.addEventListener("click", () => handleVibeAction(n.id, "reject", n.actor));

        btnGroup.append(acceptBtn, rejectBtn);
        card.appendChild(btnGroup);
      }

      notificationList.appendChild(card);
    });
  })
  .catch(err => {
    console.error("Error loading notifications:", err);
  });

function handleVibeAction(notificationId, action, actor) {
  fetch("/api/respond_vibe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ notificationId, action, actor })
  })
  .then(res => res.json())
  .then(data => {
    // Remove the notification card immediately upon successful action
    const card = document.querySelector(`.notification-card[data-id="${notificationId}"]`);
    if (card && card.parentElement) {
      card.parentElement.removeChild(card);
    }
    // If list becomes empty, show empty state message
    if (document.querySelectorAll('.notification-card').length === 0) {
      notificationList.innerHTML = "<p>No notifications yet.</p>";
    }
    console.log(data.message);
  })
  .catch(err => console.error("Error responding to vibe:", err));
}


// Fetch profile data for right panel
document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/user_profile", { method: "GET", credentials: "include" })
    .then(res => res.json())
    .then(data => {
      document.querySelector(".your-name").textContent = data.full_name;
      document.querySelector(".your-zodiac").textContent = data.zodiac_sign || "♒";
      document.querySelector(".your-bio").textContent = data.bio || "No bio provided";

      const yourPic = document.querySelector(".your-pic");
      const src = data.profile_pic_url || (data.profile_pic && data.profile_pic.trim() !== "" ? `/uploads/${data.profile_pic}` : "/uploads/default.jpg");
      yourPic.src = src;
      yourPic.onerror = () => { yourPic.src = "/uploads/default.jpg"; };
    })
    .catch(err => console.error("Error fetching profile:", err));
});
