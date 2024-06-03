import { getJson, postJson } from "./utils.js";

function Login(context) {
	postJson("/api/login", {
		username: "user",
		password: "password",
	}).then(data => {
		let content = document.getElementById("login-content");
		if (data.error)
			content.innerText = `Error: ${data.error}`;
		else
			content.innerText = `${data.success}!`;
	});
	return /*html*/`
		<div>
			<h1>Login</h1>
			<p id="login-content">Loading...</p>
		</div>
	`;
}

export { Login };
