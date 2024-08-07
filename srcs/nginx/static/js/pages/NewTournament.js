/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   NewTournament.js                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/26 16:45:15 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/26 09:49:32 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, redirect } from "../script.js";
import { postJson } from "../utils.js";


async function NewTournament(context) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<div id="no-tournament">

			<h1>${getLang(context, "pages.tournament.noTournament")}</h1>

			<hr>

			<p>${getLang(context, "pages.tournament.noTournamentDesc")}</p>

			<div id="modes">
				<div class="container">
					<input type="radio" name="mode-radio" autocomplete="off" class="mode-input" id="mode-br" checked>
					<label class="mode-label" for="mode-br">Battle<br>Royale</label>

					<input type="radio" name="mode-radio" autocomplete="off" class="mode-input" id="mode-tc">
					<label class="mode-label" for="mode-tc">Tic Tac<br>Toe</label>
				</div>
				<hr>
			</div>

			<div class="kbd-span">
				<span class="pointer notSelectable" decr="player-count">-</span>
				<input type="number" id="player-count" class="fs-5 fw-light w100" value="5" min="2" max="1000">
				<span class="pointer notSelectable" incr="player-count">+</span>
			</div>

			<button id="create-tournament" class="btn btn-outline-success">${getLang(context, "pages.tournament.create")}</button>

			<a href="/tournament" data-link><button id="back-from-new" class="btn btn-outline-secondary"><span>⤆<span></button></a>

		</div>
	`;

	setTimeout(() => {
		let modeBR = document.getElementById("mode-br");
		let modeTC = document.getElementById("mode-tc");
		let playerCount = document.getElementById("player-count");
		let createTournament = document.getElementById("create-tournament");

		if (!modeBR || !modeTC || !playerCount || !createTournament)
			return;

		document.querySelectorAll("[decr]").forEach(e => e.onclick = () => {
			let input = document.getElementById(e.getAttribute("decr"));
			input.value = parseInt(input.value) - 1;
			normalizePlayers(playerCount);
		});
		document.querySelectorAll("[incr]").forEach(e => e.onclick = () => {
			let input = document.getElementById(e.getAttribute("incr"));
			input.value = parseInt(input.value) + 1;
			normalizePlayers(playerCount);
		});
		document.querySelectorAll("input[type=number]").forEach(e => {
			e.addEventListener("focus", (e) => e.target.select());
			e.addEventListener("wheel", event => {
				let input = event.target;
				input.value = parseInt(input.value) + (event.deltaY < 0 ? 1 : -1);
				normalizePlayers(playerCount);
			}, { passive: false });
		});

		playerCount.addEventListener("change", () => changePlayers(playerCount));

		createTournament.onclick = () => {
			let count = normalizePlayers(playerCount);
			postJson(context, "/api/tournament/new", {
				mode: modeBR.checked ? "BR" : "TC",
				players: count,
			}).then(data => {
				if (data.ok)
					redirect(`/tournament/${data.tid}`, true, data);
				else {
					persistError(context, getLang(context, data.error, data.args));
					pushPersistents(context);
				}
			});
		};
	}, 200);
	return div.innerHTML;
}

function normalizePlayers(current) {
	let val = parseInt(current.value);
	let min = parseInt(current.min);
	let max = parseInt(current.max);
	if (isNaN(val))
		val = min;
	if (val < min)
		val = min;
	if (val > max)
		val = max;
	current.value = val;
	return val;
}

function changePlayers(current) {
	if (current.value.length == 0)
		return;
	let val = parseInt(current.value);
	if (isNaN(val)) {
		current.value = "";
		return;
	}
	normalizePlayers(current);
	current.blur();
}


export { NewTournament };
