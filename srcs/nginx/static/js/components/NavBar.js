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

import { getLang, onLogin, persistError, redirect } from "../script.js";
import { getJson } from "../utils.js";
import { GetNotificationsNumber, ToggleChat } from "./Chat.js";


var stunned = false;

async function NavBar(title, context, fetchProfile = true) {
	let data = await getJson(context, "/api/logged");
	if (data.ok) {
		if (!context.user.isAuthenticated)
			await onLogin(context, data);
	} else {
		if (context.user.isAuthenticated) {
			context.user.isAuthenticated = false;
			context.user.token = null;
			persistError(context, getLang(context, "errors.sessionExpired"));
		}
	}

	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<nav id="navbar" class="navbar">
			<div class="container-fluid">
				<div class="navbar-brand">
					<div id="menu-trigger">
						<img class="notSelectable" src="/static/img/menu.svg" alt="Menu">
						<div class="notificationNumber"></div>
					</div>
					<div id="menu-container">
						<img class="notSelectable" src="/static/img/circle1.svg" alt="">
						<img class="notSelectable" src="/static/img/circle2.svg" alt="">
						<img class="notSelectable" src="/static/img/circle1.svg" alt="">
						<img class="notSelectable" src="/static/img/game.svg" alt="" id="goto-play">
						<img class="notSelectable" src="/static/img/win.svg" alt="" id="goto-tour">
						<img class="notSelectable" src="/static/img/chat.svg" alt="" id="goto-chat">
						<div class="notificationNumber"></div>
					</div>
				</div>
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
	if (next === "/login" || next === "/register" || next === "/logout") {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has("next"))
			next = urlParams.get("next");
		else
			next = "/";
	}

	if (context.user.isAuthenticated) {
		right.innerHTML = /*html*/`
			<a type="button" class="" href="/profile" id="" data-link><img class="profile-picture notSelectable" src="${context.user.picture ? context.user.picture : '/static/img/user.svg'}" alt="${getLang(context, "navbar.profilePictureAlt")}"></a>
			<div type="button" id="logout-btn-zone">${getLang(context, "navbar.logout")}</div>
			<a type="button" class="a-no-style profile-name" href="/profile" data-link>${getLang(context, "loading")}</a>
			<a type="button" class="btn btn-outline-danger nav-links" href="/logout?next=${next}" id="logout-btn" data-link>${getLang(context, "navbar.logout")}</a>
		`;
		right.classList.add("profile");
		right.querySelector(".profile-name").innerText = context.user.username;
		div.querySelectorAll("#navbar-right div").forEach(e => e.onclick = () => redirect("/profile"));
		div.querySelectorAll("#navbar-right img").forEach(e => e.onclick = () => redirect("/profile"));
	} else {
		right.innerHTML = /*html*/`
			<a type="button" class="btn btn-outline-secondary" href="/login?next=${next}" data-link>${getLang(context, "navbar.login")}</a>
			<a type="button" class="btn btn-outline-primary" href="/register?next=${next}" data-link>${getLang(context, "navbar.register")}</a>
		`;
	}
		let menu = div.querySelector("#menu-trigger");
		let menuContainer = div.querySelector("#menu-container");
		let gotoPlay = div.querySelector("#goto-play");
		let gotoTour = div.querySelector("#goto-tour");
		let gotoChat = div.querySelector("#goto-chat");
		var gotoChatNotification = div.querySelector("#menu-container .notificationNumber");

		if (!menu || !menuContainer || !gotoPlay || !gotoTour || !gotoChat || !gotoChatNotification)
			return;
		menu.onclick = () => {
			if (stunned)
				return;
			if (menuContainer.style.display === "none" || menuContainer.style.display === "") {
				openMenu(menu, menuContainer, gotoPlay, gotoTour, gotoChat, gotoChatNotification);
			} else {
				closeMenu(menu, menuContainer, gotoPlay, gotoTour, gotoChat, gotoChatNotification);
			}
		};
		gotoPlay.onclick = () => {
			if (stunned)
				return;
			closeMenu(menu, menuContainer, gotoPlay, gotoTour, gotoChat, gotoChatNotification);
			setTimeout(() => redirect("/play"), 900);
		};
		gotoTour.onclick = () => {
			if (stunned)
				return;
			closeMenu(menu, menuContainer, gotoPlay, gotoTour, gotoChat, gotoChatNotification);
			setTimeout(() => redirect("/tournament"), 900);
		};
		gotoChat.onclick = () => {
			if (stunned)
				return;
			closeMenu(menu, menuContainer, gotoPlay, gotoTour, gotoChat, gotoChatNotification);
			ToggleChat();
		};
		OnNotification(div.querySelector("#navbar"));
	return div;
}

function openMenu(menu, container, gotoPlay, gotoTour, gotoChat, gotoChatNotification) {
	if (!menu || !container || !gotoPlay || !gotoTour || !gotoChat || !gotoChatNotification)
		return;

	var menuImg = menu.querySelector("img");
	stunned = true;
	menuImg.style.transform = "rotate(0deg)";
	container.style.display = "inline-block";
	container.style.transform = "scale(0.001)";
	container.style.opacity = "0";
	gotoPlay.style.opacity = "0";
	gotoTour.style.opacity = "0";
	gotoChat.style.opacity = "0";
	gotoChatNotification.style.opacity = "0";
	setTimeout(() => {
		container.style.opacity = "1";
		container.style.transform = "scale(1)";
		menuImg.style.transform = "rotate(-90deg)";
	}, 50);
	setTimeout(() => {
		gotoPlay.style.opacity = "1";
	}, 500);
	setTimeout(() => {
		gotoTour.style.opacity = "1";
	}, 700);
	setTimeout(() => {
		gotoChat.style.opacity = "1";
		gotoChatNotification.style.opacity = "1";
	}, 900);
	setTimeout(() => {
		stunned = false;
	}, 1000);

	// Close on Escape
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && !stunned && container.style.display !== "none") {
			event.preventDefault();
			closeMenu(menu, container, gotoPlay, gotoTour, gotoChat, gotoChatNotification);
		}
	});
}

function closeMenu(menu, container, gotoPlay, gotoTour, gotoChat, gotoChatNotification) {
	if (!menu || !container || !gotoPlay || !gotoTour || !gotoChat || !gotoChatNotification)
		return;

	var menuImg = menu.querySelector("img");
	stunned = true;
	menuImg.style.transform = "rotate(-90deg)";
	container.style.opacity = "1";
	gotoPlay.style.opacity = "1";
	gotoTour.style.opacity = "1";
	gotoChat.style.opacity = "1";
	gotoChatNotification.style.opacity = "1";
	setTimeout(() => {
		gotoChatNotification.style.opacity = "0";
		gotoChat.style.opacity = "0";
		menuImg.style.transform = "rotate(0deg)";
	}, 50);
	setTimeout(() => {
		gotoTour.style.opacity = "0";
	}, 150);
	setTimeout(() => {
		gotoPlay.style.opacity = "0";
	}, 250);
	setTimeout(() => {
		container.style.opacity = "0";
	}, 350);
	setTimeout(() => {
		container.style.display = "none";
		stunned = false;
	}, 1000);
}

async function overrideNavBar(title, context) {
	let container = document.getElementById("navbar");
	if (container)
		container.outerHTML = await NavBar(title, context, false);
}

function OnNotification(navbar = null) {
	if (!navbar)
		navbar = document.getElementById("navbar");
	if (!navbar)
		return;
	var nbNotification = GetNotificationsNumber();
	var notifContainers = navbar.querySelectorAll(".notificationNumber")
	if (nbNotification > 9)
		nbNotification = "9+";
	// else if (nbNotification !== 0)
	// 	nbNotification.toString();
	for (let notifContainer of notifContainers) {
		if (nbNotification !== 0) {
			notifContainer.style.display = "block";
			notifContainer.innerText = nbNotification;
		}
		else
			notifContainer.style.display = "none";
	}

}


export { NavBar, overrideNavBar, OnNotification };
