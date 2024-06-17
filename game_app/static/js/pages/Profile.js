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
import { getJson, postJson } from "../utils.js";

function Profile(context, username) {
	let persistentBackup = persistCopy(context);
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.profile.title"), context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div id="profile-content" class="block-blur">
			<div class="block-blur-pad"></div>
			<div class="container-fluid">

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
							<th scope="col">${getLang(context, "pages.profile.result")}</th>
							<th scope="col">${getLang(context, "pages.profile.gameLink")}</th>
							<th scope="col">${getLang(context, "pages.profile.date")}</th>
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
	setTimeout(() => {
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

		let profileName = document.getElementById("profile-name");
		let profileUsername = document.getElementById("profile-username");
		let profilePicture = document.getElementById("profile-picture");
		let ratingGamesWon = document.getElementById("rating-games-won");
		let ratingGamesLost = document.getElementById("rating-games-lost");
		let ratingRatio = document.getElementById("rating-ratio");
		let navLabelTotal = document.getElementById("nav-label-total");

		let uids = [];
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
		
		if (profileName)
			profileName.innerText = context.user.firstName + " " + context.user.lastName.toUpperCase();
		if (profileUsername)
			profileUsername.innerText = context.user.username;
		if (profilePicture && context.user.picture)
			profilePicture.src = context.user.picture;
		
		getJson("/api/game/u/" + username).then(data => {
			if (!data.ok) {
				persistError(context, getLang(context, data.error) + " (/api/game/u/" + username + ")");
				pushPersistents(context);
				return;
			}
			uids = [...data.won, ...data.lost];
			totalPage = Math.ceil(uids.length / 8);
			if (ratingGamesWon)
				ratingGamesWon.innerText = data.wonLength;
			if (ratingGamesLost)
				ratingGamesLost.innerText = data.lostLength;
			if (ratingRatio)
				ratingRatio.innerText = data.winrate.substring(0, 5) + "%";
			if (navLabelTotal)
				navLabelTotal.innerText = totalPage;
			tablePage(context, uids, page, totalPage);
		});
	}, 250);
	return div.innerHTML;
}

function tablePage(context, uids, page, totalPage) {
	if (page == 1)
		window.history.replaceState(null, null, window.location.pathname);
	else
		window.history.replaceState(null, null, window.location.pathname + "?page=" + page);

	let uidsPage = uids.slice((page - 1) * 8, page * 8);

	postJson("/api/game/l", { uids: uidsPage }).then(data => {
		if (!data.ok) {
			persistError(context, getLang(context, data.error) + " (/api/game/l)");
			pushPersistents(context);
			return;
		}

		let gamesTable = document.getElementById("games-table").querySelector("tbody");
		let navPrevious = document.getElementById("nav-previous");
		let navNext = document.getElementById("nav-next");
		let navLabelCurrent = document.getElementById("nav-label-current");

		if (navLabelCurrent)
			navLabelCurrent.innerText = page;
	
		if (gamesTable) {
			gamesTable.innerHTML = "";
			data.games.forEach(game => {
				let won = game.winner === context.user.username;
				let date = new Date(game.waiting ? game.createdAt
					: game.playing ? game.startedAt : game.endedAt)
					.toLocaleDateString();
				let tr = document.createElement("tr");
				tr.innerHTML = /*html*/`
					<td class="game-${won ? "won" : "lost"}">${won ? "Win" : "Lost"}</td>
					<td><a href="/play/${game.uid}" data-link>PONG #${game.uid} !</a></td>
					<td>${date}</td>
				`;
				gamesTable.appendChild(tr);
			});
		}

		if (navPrevious) {
			if (page <= 1)
				navPrevious.disabled = true;
			else {
				navPrevious.disabled = false;
				navPrevious.onclick = () => tablePage(context, uids, page - 1, totalPage);
			}
		}

		if (navNext) {
			if (page >= totalPage)
				navNext.disabled = true;
			else {
				navNext.disabled = false;
				navNext.onclick = () => tablePage(context, uids, page + 1, totalPage);
			}
		}
	});
}

function CompleteProfileSample(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Profile Sample", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div id="profile-content" class="block-blur">
			<div class="block-blur-pad"></div>
			<div class="container-fluid">

				<div class="profile">
					<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture">
					<span id="profile-name">Léopold LEMARCHAND</span>
					<sub id="profile-username">llemarch</sub>
				</div>

				<div class="rating">
					<span class="rating-label">Ratio :</span>
					<span class="rating-games">
						<span id="rating-games-won">15</span>
						<span>|</span>
						<span id="rating-games-lost">12</span>
					</span>
					<span id="rating-ratio">42.12%</span>
				</div>

				<table class="table table-striped" id="games-table">
					<thead>
						<tr>
							<th scope="col">Result</th>
							<th scope="col">Game link</th>
							<th scope="col">Date</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-lost">Lost</td>
							<td><a href="/play/1943">PONG #1943 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
					</tbody>
				</table>

				<div class="nav">
					<button type="button" class="btn btn-outline-primary nav-links">Previous</button>
					<span class="nav-labels">
						<span class="nav-label" id="nav-label-current">3</span>
						<span class="nav-label">/</span>
						<span class="nav-label" id="nav-label-total">17</span>
					</span>
					<button type="button" class="btn btn-outline-primary nav-links">Next</button>
				</div>

			</div>
			<div class="block-blur-pad"></div>
		</div>
	`;
	return div.outerHTML;
}

export { Profile, CompleteProfileSample };
