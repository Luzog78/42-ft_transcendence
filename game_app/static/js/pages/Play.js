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

function Play(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.play.title"), context);
	div.innerHTML += Persistents(context);
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
	setTimeout(() => {
		let form = document.querySelector("#play-form");
		if (form === null)
			return;
		form.onsubmit = (event) => event.preventDefault();
		document.querySelector("#join-button").onclick = () => {
			clearFeedbacks(form);
			if (!checkUID(context, "#uid"))
				return;
			redirect(`/play/${document.querySelector("#uid").value}`);
		};
		document.querySelector("#play-button").onclick = () => {
			getJson(context, "/api/game/rand").then(data => {
				if (data.ok) {
					if (data.uid)
						redirect(`/play/${data.uid}`);
					else
						getJson(context, "/api/game/new").then(data => {
							if (data.ok)
								redirect(`/play/${data.uid}`);
							else {
								persistError(context, getLang(context, data.error));
								pushPersistents(context);
							}
						});
				} else {
					persistError(context, getLang(context, data.error));
					pushPersistents(context);
				}
			});
		};
		document.querySelector("#create-button").onclick = () => {
			getJson(context, "/api/game/new").then(data => {
				if (data.ok)
					redirect(`/play/${data.uid}`);
				else {
					persistError(context, getLang(context, data.error));
					pushPersistents(context);
				}
			});
		};
	}, 200);
	return div.innerHTML;
}

export { Play };
