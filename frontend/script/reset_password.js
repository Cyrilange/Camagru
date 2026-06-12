function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

document.getElementById("reset-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = e.target.password.value;
  const confirm = e.target.confirm.value;
  const token = getToken();

  const msg = document.getElementById("msg");

  if (password !== confirm) {
    msg.style.color = "red";
    msg.textContent = "Passwords do not match";
    return;
  }

  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token, password })
  });

  const data = await res.json();

  if (res.ok) {
    msg.style.color = "lightgreen";
    msg.textContent = "Password updated";
    setTimeout(() => window.location.href = "/login.html", 1500);
  } else {
    msg.style.color = "red";
    msg.textContent = data.error || "Error";
  }
});