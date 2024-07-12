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
import { getLang, persistError, persistSuccess } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { Chat } from "../components/Chat.js"


async function Home(context) {
	let div = document.createElement("div");
	div.innerHTML = await NavBar(getLang(context, "pages.home.title"), context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div class="container" id="home-content">${getLang(context, "loading")}</div>
		<button type="button" class="btn btn-primary" id="1234">Click</button>
	`;
	div.appendChild(Chat(context));
	getJson(context, "/api/user").then(data => {
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
		} else {
			content.innerHTML = /*html*/`
				<h3>${getLang(context, "pages.home.h0")}</h3>
				<p class="home-error">${getLang(context, "loading")}</p>
			`;
			content.querySelector(".home-error").innerText = getLang(context, data.error);
		}

		document.getElementById("1234").onclick = () => {
			persistSuccess(context, "This is a success !");
			persistError(context, "This is an error...");
			pushPersistents(context);
		};
	});
	return div.innerHTML;
}


export { Home };
