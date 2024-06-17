/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Home.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:11 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:11 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getJson } from "../utils.js";
import { getLang, persist, persistCopy, refresh } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";

function Home(context) {
	var persistentBackup = persistCopy(context);
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.home.title"), context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div class="container" id="home-content">${getLang(context, "loading")}</div>
		<button type="button" class="btn btn-primary" id="1234">Click</button>
	`;
	getJson("/api/profile").then(data => {
		let content = document.getElementById("home-content");
		if (content === null)
			return;
		if (data.ok) {
			content.innerHTML = /*html*/`
				<h3>
					${getLang(context, "pages.home.h1")}
					<span id="home-realname"></span>
					${getLang(context, "pages.home.h2")}
				</h3>
				<br>
				<p>${getLang(context, "pages.home.p0")}</p>
			`;
			content.querySelector("#home-realname").innerText = `${data.firstName} ${data.lastName}`;
			context.user.username = data.username;
			context.user.firstName = data.firstName;
			context.user.lastName = data.lastName;
			context.user.email = data.email;
			if (!context.user.is_authenticated) {
				context.user.is_authenticated = true;
				persist(context, persistentBackup);
				refresh();
			}
		} else {
			content.innerHTML = /*html*/`
				<h3>${getLang(context, "pages.home.h0")}</h3>
				<p class="home-error">${getLang(context, "loading")}</p>
			`;
			content.querySelector(".home-error").innerText = getLang(context, data.error);
			context.user.is_authenticated = false;
		}
	});
	return div.innerHTML;
}

export { Home };
