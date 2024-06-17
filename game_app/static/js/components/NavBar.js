/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   NavBar.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:27 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:27 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getLang } from "../script.js";
import { getJson } from "../utils.js";

function NavBar(title, context, fetchProfile = true) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<nav id="#navbar" class="navbar">
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
	if (context.user.isAuthenticated) {
		right.innerHTML = /*html*/`
			<a href="/profile" data-link><img class="profile-picture" src="${context.user.picture ? context.user.picture : '/static/img/user.svg'}" alt="${getLang(context, "navbar.profilePictureAlt")}"></a>
			<div type="button" class="btn nav-links" id="logout-btn-zone">${getLang(context, "navbar.logout")}</div>
			<a class="a-no-style profile-name" href="/profile" data-link>${getLang(context, "loading")}</a>
			<a type="button" class="btn btn-outline-danger nav-links" href="/logout?next=${next}" id="logout-btn" data-link>${getLang(context, "navbar.logout")}</a>
		`;
		right.classList.add("profile");
		right.querySelector(".profile-name").innerText = context.user.username;
	} else {
		right.innerHTML = /*html*/`
			<a type="button" class="btn btn-outline-secondary" href="/login?next=${next}" data-link>${getLang(context, "navbar.login")}</a>
			<a type="button" class="btn btn-outline-primary" href="/register?next=${next}" data-link>${getLang(context, "navbar.register")}</a>
		`;
	}
	if (fetchProfile)
		getJson("/api/user").then(data => {
			if (data.ok) {
				context.user.username = data.username;
				context.user.createdAt = data.createdAt;
				context.user.email = data.email;
				context.user.firstName = data.firstName;
				context.user.lastName = data.lastName;
				context.user.picture = data.picture;
				context.user.lang = data.lang;
				context.user.a2f = data.a2f;
				context.user.isAdmin = data.isAdmin;
				context.user.lastLogin = data.lastLogin;
				if (!context.user.isAuthenticated) {
					context.user.isAuthenticated = true;
					overrideNavBar(title, context);
				}
			}
		});
	return div.innerHTML;
}

function overrideNavBar(title, context) {
	let container = document.getElementById("#navbar");
	if (container)
		container.outerHTML = NavBar(title, context, false);
}

export { NavBar, overrideNavBar };
