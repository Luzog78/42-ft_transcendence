import { redirect } from "../script.js";

function NavBar(title, context) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<nav class="navbar">
			<div class="container-fluid">
				<a class="navbar-brand" href="#">
					<img src="/static/img/menu.svg" alt="Menu">
				</a>
				<h1>
					<a class="a-no-style" id="navbar-title" href="/" data-link></a>
				</h1>
				<div id="navbar-right">
				</div>
			</div>
		</nav>
	`;
	div.querySelector("#navbar-title").innerText = title;
	let right = div.querySelector("#navbar-right");
	let next = window.location.pathname;
	if (context.user.is_authenticated) {
		right.innerHTML = /*html*/`
			<img class="profile-picture" src="/static/img/user.svg" alt="No profile picture">
			<a class="a-no-style profile-name" href="/logout?next=${next}" data-link>Loading...</a>
		`;
		right.querySelector(".profile-name").innerText = context.user.username;
	} else {
		right.innerHTML = /*html*/`
			<a type="button" class="btn btn-outline-secondary" href="/login?next=${next}" data-link>Login</a>
			<a type="button" class="btn btn-outline-primary" href="/register" data-link>Register</a>
		`;
	}
	return div.outerHTML;
}

export { NavBar };
