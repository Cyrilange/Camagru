function showRegisterPrompt() {
	const box = document.getElementById("login-error");
  
	box.innerHTML = `
	  Invalid credentials.<br>
	  <button id="go-register" style="margin-top:10px;">
		Do you want to register?
	  </button>
	`;
  
	document.getElementById("go-register").addEventListener("click", () => {
	  window.location.href = "/register.html";
	});
  }

document.getElementById("login-form").addEventListener("submit", async (e) => {
	e.preventDefault();
  
	const form = new FormData(e.target);
  
	const data = {
	  identifier: form.get("username") || form.get("email"),
	  password: form.get("password")
	};
  
	const res = await fetch("/api/auth/login", {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json"
	  },
	  credentials: "include",
	  body: JSON.stringify(data)
	});
  
	if (res.ok) {
	  window.location.href = "/wall.html";
	  return;
	}
  
	showRegisterPrompt();
  });

  document.getElementById("forgot-form").addEventListener("submit", async (e) => {
	e.preventDefault();
  
	const form = new FormData(e.target);
  
	const res = await fetch("/api/auth/forgot-password", {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json"
	  },
	  body: JSON.stringify({
		email: form.get("email")
	  })
	});
  
	const msg = document.getElementById("msg");
  
	if (res.ok) {
	  msg.textContent = "Reset link sent to your email.";
	} else {
	  msg.textContent = "Email not found.";
	}
  });