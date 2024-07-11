/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   TournamentList.js                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/05 14:30:41 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/11 03:39:41 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { pushPersistents } from "../components/Persistents.js";
import { getLang, persistError } from "../script.js";
import { getJson, HowLongAgo, postJson, toLocalDateStringFormat } from "../utils.js";


async function TournamentList(context) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<h1>List</h1>
		<hr>

		<table class="table table-striped" id="tournament-table">
			<thead>
				<tr>
					<th scope="col" style="width: 20%;">TID</th>
					<th scope="col" style="width: 20%;">Players</th>
					<th scope="col" style="width: 30%;">Satus</th>
					<th scope="col" style="width: 30%;">Creation</th>
				</tr>
			</thead>
			<tbody>
			</tbody>
		</table>

		<span href="/create" data-link><button id="go-to-new" class="btn btn-outline-secondary"><span>+<span></button></span>
	`;

	setTimeout(() => {
		let table = document.querySelector("#tournament-table");
		if (!table) {
			setTimeout(() => refresh(), 1000);
			return;
		}

		getJson(context, "/api/tournament/get").then(async data => {
			if (data.ok) {
				let tbody = table.querySelector("tbody");
				if (!tbody)
					return;

				if (data.tournaments.length == 0) {
					let tr = document.createElement("tr");
					tr.innerHTML = /*html*/`
						<td colspan="4" id="no-tournament-found">${getLang(context, "pages.tournament.noTournamentFound")}</td>
					`;
					tbody.appendChild(tr);
				}

				let tids = data.tournaments
					.map(tid => [tid[0], new Date(tid[1])])
					.sort((a, b) => b[1] - a[1])
					.map(tidDate => tidDate[0]);

				let sliced = tids.slice(0, 50);
				tids = tids.slice(50);
				await appendTournaments(context, sliced, tbody);

				setTimeout(() => {
					if (table.parentElement.scrollTop + table.parentElement.clientHeight < table.parentElement.scrollHeight) {
						let scrollable = true;
						let bottom = false;
						let lastScrollTop = 0;

						let scrollUp = document.createElement("button");
						scrollUp.id = "scroll-up";
						scrollUp.className = "btn btn-outline-secondary";
						scrollUp.innerHTML = /*html*/`<span>⇪ ⇪ ⇪</span>`;
						scrollUp.addEventListener("click", () => {
							bottom = false;
							scrollable = false;
							let st = table.parentElement.scrollTop;
							let speed = st / 100;
							let interval = setInterval(() => {
								st -= speed;
								if (st <= 0) {
									table.parentElement.scrollTop = 0;
									scrollable = true;
									clearInterval(interval);
								} else
									table.parentElement.scrollTop = st;
							}, 1);
						});
						table.parentElement.appendChild(scrollUp);

						let loadLabel = document.createElement("div");
						loadLabel.id = "load-label";
						table.parentElement.appendChild(loadLabel);

						table.parentElement.appendChild(document.createElement("div"));

						table.parentElement.addEventListener("scroll", async () => {
							if (!scrollable || tids.length == 0)
								return;

							let st = table.parentElement.scrollTop;
							let sh = table.parentElement.scrollHeight;
							let ch = table.parentElement.clientHeight;
							if (st > lastScrollTop) {
								if (st + ch >= sh) {
									if (!bottom) {
										st -= 10;
										setTimeout((st) => table.parentElement.scrollTop = st, 50, st);
										bottom = true;
										scrollable = false;
										setTimeout(() => scrollable = true, 200);
										loadLabel.innerText = "Scroll down to load more..."; // TODO: Translate
									} else {
										bottom = false;
										scrollable = false;
										loadLabel.innerText = "⌛";
										sliced = tids.slice(0, 50);
										let result = await appendTournaments(context, sliced, tbody);
										scrollable = true;
										if (!result) {
											table.parentElement.scrollTop -= 10;
											setTimeout(() => {
												loadLabel.innerText = "[❌] Try again..."; // TODO: Translate
											}, 50, st);
											return;
										}
										tids = tids.slice(50);
										if (tids.length == 0)
											loadLabel.remove();
										else
											loadLabel.innerText = "";
									}
								}
							} else {
								bottom = false;
								loadLabel.innerText = "";
							}
							lastScrollTop = st;
						});
					}
				}, 50);

			} else {
				persistError(context, getLang(context, data.error))
				pushPersistents(context);
			}
		});
	}, 200);
	return div.innerHTML;
}


async function appendTournaments(context, tids, tbody) {
	let data = await postJson(context, "/api/tournament/list", { tids: tids });
	if (!data.ok) {
		persistError(context, getLang(context, data.error));
		pushPersistents(context);
		return false;
	}

	for (var i = 0; i < data.foundLength; i++) {
		let t = data.found[i];
		let d = new Date(t.createdAt);
		let date = toLocalDateStringFormat(d);
		let ago = new HowLongAgo(d).toFixedString();
		let tr = document.createElement("tr");
		tr.innerHTML = /*html*/`
			<td><a href="/tournament/${t.tid}" data-link>#${t.tid}</a></td>
			<td><span>${t.players.length}</span><span>/</span><span>${t.playerCount}</span></td>
		`;
		if (t.ended)
			tr.innerHTML += /*html*/`<td><span class="finished">FINISHED</span></td>`;
		else if (t.status == "P")
			tr.innerHTML += /*html*/`<td><span class="pending">PENDING...</span></td>`;
		else if (t.status == "O")
			tr.innerHTML += /*html*/`<td><span class="ongoing">ONGOING...</span></td>`;
		else
			tr.innerHTML += /*html*/`<td><span>${t.status}</span></td>`;
		tr.innerHTML += /*html*/`<td date="${date}" ago="${ago}"></td>`;
		tbody.appendChild(tr);
	}

	let datesTd = tbody.querySelectorAll("td:nth-child(4)");
	datesTd.forEach(td => {
		td.onmouseover = () => td.innerText = td.getAttribute("date");
		td.onmouseout = () => td.innerText = td.getAttribute("ago");
		td.innerText = td.getAttribute("ago");
	});

	return true;
}


export { TournamentList };
