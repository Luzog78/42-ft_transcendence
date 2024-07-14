/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Play.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:18 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:18 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, redirect } from "../script.js";
import { checkUID, clearFeedbacks, getJson } from "../utils.js";


async function Play(context) {
	let div = document.createElement("div");
	div.innerHTML += /*html*/`
		<div class="container container-blur form-ssm" style="padding: 50px; margin-top: 100px;">
			<form class="row g-3" id="play-form" style="margin-top: 0; margin-bottom: 0;">
				<div class="row col-12">
					<div class="col-8" style="padding-right: 2px;">
						<input type="text" class="form-control" id="uid" placeholder="${getLang(context, "pages.play.placeholder")}">
					</div>
					<div class="col-4" style="padding-left: 2px;">
						<button id="join-button" class="btn btn-success" type="submit">${getLang(context, "pages.play.join")}</button>
					</div>
				</div>

				<hr>

				<div class="row col-12">
					<div class="col-12">
						<button id="play-button" class="btn btn-success">${getLang(context, "pages.play.play")}</span>
					</div>
				</div>

				<div class="row col-12" style="margin-top: 4px; margin-bottom: 0;">
					<div class="col-12">
						<button id="create-button" class="btn btn-outline-info">${getLang(context, "pages.play.create")}</span>
					</div>
				</div>
			</form>
		</div>
	`;
	
	div.insertBefore(await NavBar(getLang(context, "pages.play.title"), context), div.firstChild);
	div.insertBefore(Persistents(context), div.firstChild);
	
	let form = div.querySelector("#play-form");
	if (form === null)
		return;
	form.onsubmit = (event) => event.preventDefault();
	div.querySelector("#join-button").onclick = () => {
		clearFeedbacks(form);
		if (!checkUID(context, "#uid"))
			return;
		redirect(`/play/${div.querySelector("#uid").value}`);
	};
	div.querySelector("#play-button").onclick = () => {
		getJson(context, "/api/game/rand").then(data => {
			if (data.ok) {
				if (data.uid)
					redirect(`/play/${data.uid}`);
				else {
					persistError(context, getLang(context, "error.noGameFound"));
					redirect("/new");
				}
			} else {
				persistError(context, getLang(context, data.error));
				pushPersistents(context);
			}
		});
	};
	div.querySelector("#create-button").onclick = () => redirect("/new");
	return div;
}


export { Play };
