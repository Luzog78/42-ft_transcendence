import { getJson, postJson } from "./utils.js";

function Logout(context) {
	getJson("/api/logout").then(data => {
		let content = document.getElementById("logout-content");
		if (data.error)
			content.innerText = `Error: ${data.error}`;
		else
			content.innerText = `${data.success}!`;
	});
	return /*html*/`
		<div>
			<h1>Login</h1>
			<p id="logout-content">Loading...</p>
		</div>
	`;
}

export { Logout };
