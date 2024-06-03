import { getJson, postJson } from "./utils.js";

function Home(context) {
	getJson("/api/profile").then(data => {
		let content = document.getElementById("home-content");
		if (!data.error)
			content.innerHTML = /*html*/`
				Welcome, ${data.username}!
				<br>
				Your email is ${data.email}.
			`;
		else
			content.innerHTML = "You are not logged in.";
	});
	return /*html*/`
		<div>
			<h1>Home</h1>
			<p id="home-content">Loading...</p>
		</div>
	`;
}

export { Home };
