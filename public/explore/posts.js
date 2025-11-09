document.addEventListener('DOMContentLoaded', () => {
  // Populate right panel with logged-in user
  fetch('/api/user_profile', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      document.querySelector('.your-name').textContent = data.full_name;
      document.querySelector('.your-zodiac').textContent = data.zodiac_sign || '♒';
      document.querySelector('.your-bio').textContent = data.bio || 'No bio provided';
      const pic = document.querySelector('.your-pic');
      pic.src = data.profile_pic_url || (data.profile_pic ? `/uploads/${data.profile_pic}` : '/uploads/default.jpg');
      pic.onerror = () => { pic.src = '/uploads/default.jpg'; };
    })
    .catch(() => {
      document.querySelector('.your-name').textContent = 'Guest User';
    });

  // Upload form handling
  const form = document.getElementById('postForm');
  const imageInput = document.getElementById('postImage');
  const captionInput = document.getElementById('postCaption');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = imageInput.files[0];
    if (!file) {
      alert('Please select an image');
      return;
    }
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', captionInput.value || '');

    fetch('/api/posts', {
      method: 'POST',
      credentials: 'include',
      body: fd
    })
    .then(res => res.json())
    .then(resp => {
      if (resp.success) {
        imageInput.value = '';
        captionInput.value = '';
        loadPosts();
      } else {
        alert(resp.error || 'Failed to create post');
      }
    })
    .catch(err => console.error('Error creating post:', err));
  });

  // Load posts
  function loadPosts() {
    fetch('/api/posts', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Not logged in or failed to load');
        return res.json();
      })
      .then(posts => {
        const container = document.getElementById('postsContainer');
        container.innerHTML = '';
        if (!Array.isArray(posts) || posts.length === 0) {
          container.innerHTML = '<p>No posts yet. Be the first to share!</p>';
          return;
        }
        posts.forEach(post => {
          const card = document.createElement('div');
          card.className = 'profile-card';

          const img = document.createElement('img');
          img.className = 'profile-pic';
          // Use image proxy endpoint for all images
          img.src = `/api/image/${post.id}`;
          img.style.objectFit = 'cover';
          img.onerror = () => { img.src = '/uploads/default.jpg'; };
          
          // Add click handler to open image in modal
          img.addEventListener('click', () => {
            openImageModal(img.src, post.caption, `${post.full_name || post.author_username} (@${post.author_username})`);
          });

          const name = document.createElement('div');
          name.className = 'profile-name';
          name.textContent = `${post.full_name || post.author_username} (@${post.author_username})`;

          const caption = document.createElement('div');
          caption.className = 'profile-bio';
          caption.textContent = post.caption || '';

          const meta = document.createElement('div');
          meta.className = 'profile-zodiac';
          const date = new Date(post.created_at);
          meta.textContent = `${date.toLocaleString()} • ${post.likes_count} likes • ${post.comments_count} comments`;

          const likeBtn = document.createElement('button');
          likeBtn.className = 'view-btn';
          likeBtn.textContent = post.liked_by_me ? 'Liked' : 'Like';
          likeBtn.style.marginRight = '8px';
          likeBtn.addEventListener('click', () => {
            const method = post.liked_by_me ? 'DELETE' : 'POST';
            fetch(`/api/posts/${post.id}/like`, {
              method,
              credentials: 'include'
            })
            .then(res => res.json())
            .then(resp => {
              if (resp.success) {
                post.liked_by_me = !post.liked_by_me;
                likeBtn.textContent = post.liked_by_me ? 'Liked' : 'Like';
                meta.textContent = `${date.toLocaleString()} • ${resp.likes_count} likes • ${post.comments_count} comments`;
              }
            });
          });

          const commentsToggle = document.createElement('button');
          commentsToggle.className = 'view-btn';
          commentsToggle.textContent = 'Comments';

          const commentsSection = document.createElement('div');
          commentsSection.style.marginTop = '8px';
          commentsSection.style.display = 'none';

          commentsToggle.addEventListener('click', () => {
            if (commentsSection.style.display === 'none') {
              commentsSection.style.display = 'block';
              loadComments(post.id, commentsSection, (newCount) => {
                post.comments_count = newCount;
                meta.textContent = `${date.toLocaleString()} • ${post.likes_count} likes • ${post.comments_count} comments`;
              });
            } else {
              commentsSection.style.display = 'none';
            }
          });

          card.append(img, name, caption, meta, likeBtn, commentsToggle, commentsSection);
          container.appendChild(card);
        });
      })
      .catch(err => {
        console.error('Error loading posts:', err);
        const container = document.getElementById('postsContainer');
        container.innerHTML = '<p>Please log in to view posts.</p>';
      });
  }

  function loadComments(postId, container, updateCount) {
    fetch(`/api/posts/${postId}/comments`, { credentials: 'include' })
      .then(res => res.json())
      .then(comments => {
        container.innerHTML = '';
        const list = document.createElement('div');
        list.style.marginBottom = '8px';
        if (!Array.isArray(comments) || comments.length === 0) {
          list.innerHTML = '<p>No comments yet.</p>';
        } else {
          comments.forEach(c => {
            const row = document.createElement('div');
            row.textContent = `${c.full_name || c.username}: ${c.comment_text}`;
            list.appendChild(row);
          });
        }

        const form = document.createElement('form');
        form.style.marginTop = '8px';
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Write a comment...';
        input.style.width = '70%';
        input.required = true;
        const submit = document.createElement('button');
        submit.className = 'view-btn';
        submit.textContent = 'Add Comment';
        submit.style.marginLeft = '8px';

        form.append(input, submit);
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const comment = input.value.trim();
          if (!comment) return;
          fetch(`/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ comment })
          })
          .then(res => res.json())
          .then(resp => {
            if (resp.success) {
              input.value = '';
              updateCount(resp.comments_count);
              loadComments(postId, container, updateCount);
            }
          });
        });

        container.append(list, form);
      })
      .catch(err => console.error('Error loading comments:', err));
  }

  loadPosts();

  // Image Modal Functions
  function openImageModal(imageSrc, caption, author) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalCaption = document.querySelector('.image-modal-caption');
    
    modalImage.src = imageSrc;
    modalCaption.innerHTML = `
      <strong>${author}</strong><br>
      ${caption || 'No caption'}
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  }

  // Modal event listeners
  const modal = document.getElementById('imageModal');
  const closeBtn = document.querySelector('.image-modal-close');
  
  // Close modal when clicking the X button
  closeBtn.addEventListener('click', closeImageModal);
  
  // Close modal when clicking outside the image
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeImageModal();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      closeImageModal();
    }
  });
});