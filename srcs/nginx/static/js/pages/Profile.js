/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Profile.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:22 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:22 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { getLang, persist, persistCopy, persistError, redirect } from "../script.js";
import { HowLongAgo, getJson, postJson, toLocalDateStringFormat } from "../utils.js";
import { Chat } from "../components/Chat.js";
import { Konami } from "../components/Konami.js";


async function Profile(context, username) {
	let persistentBackup = persistCopy(context);
	let div = document.createElement("div");

	div.innerHTML = /*html*/`
		<p><br><br></p>
		<div id="profile-content" class="block-blur">
			<div class="block-blur-pad"></div>
			<div class="container-fluid">

				<a id="settings" href="/settings" class="a-no-style" data-link>
					<img src="/static/img/settings.svg" alt="back">
				</a>

				<div class="profile">
					<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture">
					<span id="profile-name">${getLang(context, "loading")}</span>
					<sub id="profile-username"></sub>
				</div>

				<div class="rating">
					<span class="rating-label">${getLang(context, "pages.profile.ratio")} :</span>
					<span class="rating-games">
						<span id="rating-games-won">...</span>
						<span>|</span>
						<span id="rating-games-lost">...</span>
					</span>
					<span id="rating-ratio">00.00%</span>
				</div>

				<table class="table table-striped" id="games-table">
					<thead>
						<tr>
							<th scope="col" style="width: 20%;">${getLang(context, "pages.profile.result")}</th>
							<th scope="col" style="width: 45%;">${getLang(context, "pages.profile.gameLink")}</th>
							<th scope="col" style="width: 35%;">${getLang(context, "pages.profile.date")}</th>
						</tr>
					</thead>
					<tbody>
					</tbody>
				</table>

				<div class="nav">
					<button id="nav-previous" type="button" class="btn btn-outline-primary nav-links">
						${getLang(context, "pages.profile.previous")}
					</button>
					<span class="nav-labels">
						<span class="nav-label" id="nav-label-current">...</span>
						<span class="nav-label">/</span>
						<span class="nav-label" id="nav-label-total">...</span>
					</span>
					<button id="nav-next" type="button" class="btn btn-outline-primary nav-links">
						${getLang(context, "pages.profile.next")}
					</button>
				</div>

			</div>
			<div class="block-blur-pad"></div>
		</div>
	`;
	div.id = "ProfilePage"
	div.insertBefore(Persistents(context), div.firstChild);
	div.insertBefore(await NavBar(getLang(context, "pages.profile.title"), context), div.firstChild);
	div.appendChild(Chat(context));
	div.appendChild(Konami(context));

	if (!context.user.isAuthenticated || !context.user.username) {
		persist(context, persistentBackup);
		persistError(context, getLang(context, "errors.mustBeLoggedIn"));
		redirect("/login?next=" + window.location.pathname);
		return;
	} else if (!username) {
		persist(context, persistentBackup);
		redirect("/profile/" + context.user.username, false);
		return;
	}

	if (context.user.username !== username) {
		let back = div.querySelector("#settings");
		if (back)
			back.remove();
	}

	let profileName = div.querySelector("#profile-name");
	let profileUsername = div.querySelector("#profile-username");
	let profilePicture = div.querySelector("#profile-picture");
	let ratingGamesWon = div.querySelector("#rating-games-won");
	let ratingGamesLost = div.querySelector("#rating-games-lost");
	let ratingRatio = div.querySelector("#rating-ratio");
	let navLabelTotal = div.querySelector("#nav-label-total");

	let uidsDates = [];
	let totalPage = 0;
	let page = new URLSearchParams(window.location.search).get("page");
	if (!page)
		page = 1;
	else
		try {
			page = parseInt(page);
		} catch (e) {
			page = 1;
		}

	if (context.user.username === username) {
		if (profileName)
			profileName.innerText = context.user.firstName + " " + context.user.lastName.toUpperCase();
		if (profileUsername)
			profileUsername.innerText = context.user.username;
		if (profilePicture && context.user.picture)
			profilePicture.src = context.user.picture;
	} else {
		getJson(context, "/api/user/" + username).then(data => {
			if (!data.ok) {
				persistError(context, getLang(context, data.error) + " (/api/user/" + username + ")");
				redirect(`/profile/${username}/notfound`, false);
				return;
			}
			if (profileName)
				profileName.innerText = data.firstName + " " + data.lastName.toUpperCase();
			if (profileUsername)
				profileUsername.innerText = data.username;
			if (profilePicture && data.picture)
				profilePicture.src = data.picture;
		})
	}

	getJson(context, "/api/game/u/" + username).then(data => {
		if (!data.ok) {
			persistError(context, getLang(context, data.error) + " (/api/game/u/" + username + ")");
			pushPersistents(context);
			return;
		}
		uidsDates = [...data.won, ...data.lost, ...data.other];
		totalPage = Math.ceil(uidsDates.length / 8);
		if (ratingGamesWon)
			ratingGamesWon.innerText = data.wonLength;
		if (ratingGamesLost)
			ratingGamesLost.innerText = data.lostLength;
		if (ratingRatio)
			ratingRatio.innerText = data.winrate.substring(0, 5) + "%";
		if (navLabelTotal)
			navLabelTotal.innerText = totalPage;
		uidsDates = uidsDates.map(item => [item[0], new Date(item[1])]);
		uidsDates.sort((a, b) => b[1] - a[1]);
		tablePage(context, username, uidsDates, page, totalPage, div);
	});
	return div;
}

function tablePage(context, username, uidsDates, page, totalPage, div = null) {
	if (page == 1)
		window.history.replaceState(null, null, window.location.origin + window.location.pathname + window.location.hash);
	else
		window.history.replaceState(null, null, window.location.origin + window.location.pathname + `?page=${page}` + window.location.hash);

	if (div == null)
		div = document.getElementById("ProfilePage");

	let sliced = uidsDates.slice((page - 1) * 8, page * 8);
	let uids = sliced.map(uidDate => uidDate[0]);
	let dates = sliced.map(uidDate => uidDate[1]);

	postJson(context, "/api/game/l", { uids: uids }).then(data => {
		if (!data.ok) {
			persistError(context, getLang(context, data.error) + " (/api/game/l)");
			pushPersistents(context);
			return;
		}

		let gamesTable = div.querySelector("#games-table").querySelector("tbody");
		let navPrevious = div.querySelector("#nav-previous");
		let navNext = div.querySelector("#nav-next");
		let navLabelCurrent = div.querySelector("#nav-label-current");

		if (navLabelCurrent)
			navLabelCurrent.innerText = page;

		if (gamesTable) {
			while (gamesTable.firstChild)
				gamesTable.removeChild(gamesTable.firstChild);
			for (let i = 0; i < data.games.length; i++)
				data.games[i].date = dates[i];
			data.games.forEach(game => {
				let inProgress = game.waiting || game.playing;
				let won = game.winner && game.winner.user && game.winner.user.username === username;
				let date = toLocalDateStringFormat(game.date);
				let ago = new HowLongAgo(game.date).toFixedString();
				let tr = document.createElement("tr");
				tr.innerHTML = /*html*/`
					<td class="${inProgress ? "" : won ? "game-won" : "game-lost"}">
						${inProgress ? "In Progress..." : won ? "Won" : "Lost"}
					</td>
					<td><a href="/play/${game.uid}" data-link>PONG #${game.uid} !</a></td>
					<td date="${date}" ago="${ago}"></td>
				`;
				gamesTable.appendChild(tr);
			});
		}

		// On hover, display the real date
		let datesTd = gamesTable.querySelectorAll("td:nth-child(3)");
		datesTd.forEach(td => {
			td.onmouseover = () => td.innerText = td.getAttribute("date");
			td.onmouseout = () => td.innerText = td.getAttribute("ago");
			td.innerText = td.getAttribute("ago");
		});

		if (navPrevious) {
			if (page <= 1)
				navPrevious.disabled = true;
			else {
				navPrevious.disabled = false;
				navPrevious.onclick = () => tablePage(context, username, uidsDates, page - 1, totalPage);
			}
		}

		if (navNext) {
			if (page >= totalPage)
				navNext.disabled = true;
			else {
				navNext.disabled = false;
				navNext.onclick = () => tablePage(context, username, uidsDates, page + 1, totalPage);
			}
		}
	});
}


export { Profile };
