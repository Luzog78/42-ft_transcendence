import { getJson, postJson } from "./utils.js";

function Register(context) {
	postJson("/api/register", {
		username: "user",
		password: "password",
		email: "user123@gmail.com",
	}).then(data => {
		let content = document.getElementById("registration-content");
		if (data.error)
			content.innerText = `Error: ${data.error}`;
		else
			content.innerText = `${data.success}!`;
	});
	return /*html*/`
		<div>
			<h1>Register</h1>
			<p id="registration-content">Loading...</p>
		</div>
	`;
}

export { Register };
