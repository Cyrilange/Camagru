async function loadPosts() {
	const res = await fetch("/api/gallery/images");
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
  
		<img src="${post.image}" />
  
		<div class="actions">
		  <p>🩷 ${post.likes}</p>
		  <p>💬 ${post.comments}</p>
		</div>
	  </article>
	`).join("");
  }


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


  async function login() {
	
  }

  async function register() {

  }
  
  logout()
  loadPosts();

 