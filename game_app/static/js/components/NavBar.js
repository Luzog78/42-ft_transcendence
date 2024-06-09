import { getLang, redirect, refresh } from "../script.js";
import { getJson } from "../utils.js";

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
			<img class="profile-picture" src="/static/img/user.svg" alt="${getLang(context, "navbar.profilePictureAlt")}">
			<a class="a-no-style profile-name" href="/profile" data-link>${getLang(context, "loading")}</a>
			<a type="button" class="btn btn-outline-danger nav-links" href="/logout?next=${next}" id="logout-btn" data-link>${getLang(context, "navbar.logout")}</a>
		`;
		right.classList.add("profile");
		right.querySelector(".profile-name").innerText = context.user.username;
	} else {
		right.innerHTML = /*html*/`
			<a type="button" class="btn btn-outline-secondary" href="/login?next=${next}" data-link>${getLang(context, "navbar.login")}</a>
			<a type="button" class="btn btn-outline-primary" href="/register?next=/login;${next}" data-link>${getLang(context, "navbar.register")}</a>
		`;
	}
	getJson("/api/profile").then(data => {
		if (data.ok) {
			context.user.username = data.username;
			context.user.firstName = data.firstName;
			context.user.lastName = data.lastName;
			context.user.email = data.email;
			if (!context.user.is_authenticated) {
				context.user.is_authenticated = true;
				refresh();
			}
		}
	});
	return div.outerHTML;
}

export { NavBar };
