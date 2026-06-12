async function loadPosts() {
    const res = await fetch("/api/gallery");
    const posts = await res.json();

    const feed = document.querySelector(".feed");

    feed.innerHTML = posts.map(post => `
        <article class="post">
            <div class="post-header">
                <div class="avatar">
                    ${post.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div class="username">${post.username}</div>
            </div>

            <img src="${post.filename}" />

            <div class="actions">
                <p>🩷 ${post.likes}</p>
                <p>💬 ${post.comments}</p>
            </div>
        </article>
    `).join("");
}

async function logout() {
    const res = await fetch("/api/auth/logout", {
        method: "POST"
    });

    if (res.ok) {
        window.location.href = "/wall.html";
    }
}

async function updateAuthUI() {
    const res = await fetch("/api/auth/me", {
        credentials: "include"
    });

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

function init() {
    updateAuthUI();
    loadPosts();

    document.getElementById("logout").addEventListener("click", logout);
}

init();