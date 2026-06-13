let currentPage = 1;
const perPage = 5;

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showAuthMsg(imageId) {
    const msg = document.getElementById(`auth-msg-${imageId}`);
    if (!msg) return;
    msg.textContent = 'You must be logged in!';
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 3000);
}

async function loadPosts(page = 1) {
    const res = await fetch(`/api/gallery?page=${page}&limit=${perPage}`);
    const data = await res.json();

    const feed = document.querySelector(".feed");
    feed.innerHTML = data.images.map(post => `
        <article class="post">
            <div class="post-header">
                <div class="avatar">
                    ${escapeHtml(post.username?.[0]?.toUpperCase() || "?")}
                </div>
                <div class="username">${escapeHtml(post.username)}</div>
            </div>

            <img src="${post.filename}" />

            <div class="actions container-date_likes">
                <p class="likes" onclick="toggleLike(${post.id}, this)">🩷 ${post.likes}</p>
                <p class="com" onclick="toggleComments(${post.id}, this)">💬 ${post.comments}</p>
                <p class="date">${new Date(post.created_at).toLocaleDateString('en-GB')}</p>
            </div>

            <div id="comments-${post.id}" class="comments-section" style="display:none;">
                <div id="comments-list-${post.id}"></div>
                <div class="comment-form">
                    <input type="text" id="comment-input-${post.id}" placeholder="Add a comment...">
                    <button onclick="submitComment(${post.id})">Send</button>
                    <p id="auth-msg-${post.id}" style="display:none; color:red;"></p>
                </div>
            </div>
        </article>
    `).join("");

    document.getElementById('pageInfo').textContent = `Page ${page} / ${Math.ceil(data.total / perPage)}`;
    document.getElementById('prevPage').disabled = (page === 1);
    document.getElementById('nextPage').disabled = (page * perPage >= data.total);
}

document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    loadPosts(currentPage);
});

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadPosts(currentPage);
    }
});

async function logout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) window.location.href = "/wall.html";
}

async function updateAuthUI() {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout");

    if (!res.ok) {
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        return;
    }

    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    const user = await res.json();
    document.getElementById("username").textContent = user.username;
}

async function toggleLike(imageId, el) {
    const res = await fetch(`/api/gallery/${imageId}/like`, {
        method: 'POST',
        credentials: 'include'
    });

    if (res.status === 401) {
        showAuthMsg(imageId);
        return;
    }

    if (res.ok) {
        const data = await res.json();
        const count = parseInt(el.textContent.replace('🩷 ', ''));
        el.textContent = `🩷 ${data.message === 'like added' ? count + 1 : count - 1}`;
    }
}
window.toggleLike = toggleLike;

async function toggleComments(imageId, el) {
    const section = document.getElementById(`comments-${imageId}`);
    if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadComments(imageId);
    } else {
        section.style.display = 'none';
    }
}
window.toggleComments = toggleComments;

async function loadComments(imageId) {
    const res = await fetch(`/api/gallery/${imageId}/comments`, {
        credentials: 'include'
    });
    if (!res.ok) return;
    const comments = await res.json();
    const list = document.getElementById(`comments-list-${imageId}`);
    list.innerHTML = comments.map(c => `
        <div class="comment">
            <strong>${escapeHtml(c.username)}</strong> ${escapeHtml(c.content)}
        </div>
    `).join('');
}

async function submitComment(imageId) {
    const input = document.getElementById(`comment-input-${imageId}`);
    const content = input.value.trim();
    if (!content) return;

    const res = await fetch(`/api/gallery/${imageId}/comment`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });

    if (res.status === 401) {
        showAuthMsg(imageId);
        return;
    }

    if (res.ok) {
        input.value = '';
        await loadComments(imageId);
        const comEl = document.querySelector(`#comments-${imageId}`).previousElementSibling.querySelector('.com');
        const count = parseInt(comEl.textContent.replace('💬 ', ''));
        comEl.textContent = `💬 ${count + 1}`;
    }
}
window.submitComment = submitComment;

function init() {
    updateAuthUI();
    loadPosts();
    document.getElementById("logout").addEventListener("click", logout);
}

init();