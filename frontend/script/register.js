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
		const goodDiv = document.getElementById("good-message");
		goodDiv.innerHTML = "Erreur lors de l'inscription. Vérifie tes informations.";
	  window.location.href = "/login.html";
	} else {
		const errorDiv = document.getElementById("error-message");

		if (errorDiv) {
			errorDiv.innerHTML = "Erreur lors de l'inscription. Vérifie tes informations.";
		} else {
			console.error("register failed");
}
	}
  });