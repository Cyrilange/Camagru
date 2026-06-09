document.getElementById("register-form").addEventListener("submit", async (e) => {
	e.preventDefault();
  
	const form = new FormData(e.target);
  
	const data = {
	  username: form.get("username"),
	  email: form.get("email"),
	  password: form.get("password")
	};
  
	const res = await fetch("/api/auth/register", {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json"
	  },
	  body: JSON.stringify(data)
	});
  
	if (res.ok) {
	  window.location.href = "/login.html";
	} else {
	  console.error("register failed");
	}
  });