

//function for the wall
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

//function to log out
  async function logout() {
	try {
	  const res = await fetch("/api/auth/logout", {
		method: "POST"
	  });
  
	  if (!res.ok) {
		throw new Error("Logout failed");
	  }
  
	  window.location.href = "/wall.html";
	} catch (err) {
	  console.error(err);
	}
  }
  

  //function to check user auth
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
  
	const user = await res.json()
	const usernameEl = document.getElementById("username")
	if (usernameEl) usernameEl.textContent = user.username
  }


  //function to launch
  async function init() {
	await updateAuthUI();
	await loadPosts();
  }
  
  init();

 