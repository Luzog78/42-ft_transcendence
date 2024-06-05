import { getJson } from "../utils.js";
import { refresh } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistants } from "../components/Persistants.js";

function Home(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("PONG !", context);
	div.innerHTML += Persistants(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div class="container" id="home-content">Loading...</p>
	`;
	getJson("/api/profile").then(data => {
		let content = document.getElementById("home-content");
		if (data.ok) {
			content.innerHTML = /*html*/`
				<h3>Welcome to PONG <span id="home-realname"></span> !</h3>
				<br>
				<p>Come and play with us !</p>
			`;
			content.querySelector("#home-realname").innerText = `${data.firstName} ${data.lastName}`;
			context.user.username = data.username;
			context.user.firstName = data.firstName;
			context.user.lastName = data.lastName;
			context.user.email = data.email;
			if (!context.user.is_authenticated) {
				context.user.is_authenticated = true;
				refresh();
			}
		} else {
			content.innerHTML = /*html*/`
				<h3>An error occured...</h3>
				<p class="home-error"></p>
			`;
			content.querySelector(".home-error").innerText = data.error;
			context.user.is_authenticated = false;
		}
	});
	return div.outerHTML;
}

export { Home };
