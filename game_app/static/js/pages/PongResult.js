/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   PongResult.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/19 09:59:42 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/19 09:59:42 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, redirect } from "../script.js";
import { getJson } from "../utils.js";
import { PlayId } from "./PlayId.js";


async function PongResult(context, id, data=null) {
	if (data === null)
		return await PlayId(context, id);
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.playResult.title"), context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<div id="PongResult-content">
			<div class="PongResult-container container-blur" style="padding: 30px; margin-top: 50px;">
				<div class="PongResult-winner d-flex justify-content-center justify-content-around align-items-center">
					<img src="/static/img/crown.svg" class="d-none d-md-block">
					<img id="best-picture" src="/static/img/user.svg" alt="${getLang(context, "pages.playResult.profilePictureAlt")}" class="d-none d-sm-block">
					<a id="best-username" href="/profile/username" class="linear-wipe fs-1 fw-bold text-center">${getLang(context, "loading")}</a>
					<span id="best-score" class="linear-wipe fs-4 text-start mt-2">42 pts</span>
					<img src="/static/img/crown.svg" class="d-none d-md-block">
				</div>
				<div class="py-4">

					<div id="game-uid" class="d-flex justify-content-center fs-5">${getLang(context, "loading")}</div>
						<div class="line"></div>
					</div>

					<div id="pongResult-item" class="py-2" style="margin-top: 20px;">
						<div class="pongResult-Streak text-center">
							<div class="pongResult-Streak d-flex justify-content-center">
								<img src="/static/img/fire.svg" class="">
								<div class="circle"></div>
								<span id="best-streak" class="fw-bold fs-1">0</span>
							</div>
							<label class="pongResult-BestStreak fw-bold pt-4">${getLang(context, "pages.playResult.bestStreak")}</label>
							<br>
							<label class="result-by">
								${getLang(context, "pages.playResult.by")}
								<span class="result-by-user" id="best-streak-by">doc</span>
							</label>
						</div>
						<div class="row py-3" style="transform: translateY(-60px);">
							<div class="pongResult-Rebounds text-center col-6">
								<span id="rebounds" class="fs-3">0</span><br>
								<label>${getLang(context, "pages.playResult.rebounds")}</label>
								<br>
								<label class="result-by">
									${getLang(context, "pages.playResult.by")}
									<span class="result-by-user" id="rebounds-by">doc</span>
								</label>
							</div>
							<div class="pongResult-Ball text-center col-6">
								<span id="ultimate-speed" class="fs-3">0</span><br>
								<label>${getLang(context, "pages.playResult.ultimateSpeed")}</label>
								<br>
								<label class="result-by">
									${getLang(context, "pages.playResult.by")}
									<span class="result-by-user" id="ultimate-speed-by">doc</span>
								</label>
							</div>
						</div>
					</div>

					<div class="PongResult-ListPlayers px-5 d-flex justify-content-center">
						<div class="PongResult-players flex-nowrap text-center d-flex">
						</div>
					</div>

				</div>
			</div>
		</div>
	`;
	setTimeout(() => {
		let bestPicture = document.querySelector("#best-picture");
		let bestUsername = document.querySelector("#best-username");
		let bestScore = document.querySelector("#best-score");
		let bestStreak = document.querySelector("#best-streak");
		let bestStreakBy = document.querySelector("#best-streak-by");
		let rebounds = document.querySelector("#rebounds");
		let reboundsBy = document.querySelector("#rebounds-by");
		let ultimateSpeed = document.querySelector("#ultimate-speed");
		let ultimateSpeedBy = document.querySelector("#ultimate-speed-by");
		let gameUid = document.querySelector("#game-uid");
		let pongResultPlayers = document.querySelector(".PongResult-players");

		if (data.uid)
			gameUid.innerText = `#${data.uid}`;
		if (data.winner) {
			if (data.winner.user) {
				if (data.winner.user.picture)
					bestPicture.src = data.winner.user.picture;
				bestUsername.href = `/profile/${data.winner.user.username}`;
				bestUsername.innerText = data.winner.user.username;
			}
			bestScore.innerText = data.winner.score + " pts";
		}
		if (data.bestStreak) {
			bestStreak.innerText = data.bestStreak.score;
			if (data.bestStreak.user)
				bestStreakBy.innerText = data.bestStreak.user.username;
		}
		if (data.rebounces) {
			rebounds.innerText = data.rebounces.rebounces;
			if (data.rebounces.user)
				reboundsBy.innerText = data.rebounces.user.username;
		}
		if (data.ultimate) {
			ultimateSpeed.innerText = Math.round(data.ultimate.ultimate * 100) / 100;
			if (data.ultimate.user)
				ultimateSpeedBy.innerText = data.ultimate.user.username;
		}

		if (pongResultPlayers) {
			async function scrollH(div, amount) {
				setTimeout(() => {
					div.scrollLeft += amount > 0 ? 1 : -1;
					if (amount > 1)
						scrollH(div, amount - 1);
					else if (amount < -1)
						scrollH(div, amount + 1);
				}, 1);
			}
			pongResultPlayers.addEventListener("wheel", (e) => {
				e.preventDefault();
				scrollH(pongResultPlayers, e.deltaY * .4);
			});

			getJson(context, `/api/stats/g/${id}`).then(data => {
				if (!data.ok) {
					console.log("[❌] Could not get stats for game " + id);
					persistError(context, getLang(context, data.error));
					pushPersistents(context);
					return;
				}
				if (!data.stats || data.stats.length === 0) {
					let div = document.createElement("div");
					div.classList.add("PongResult-player", "row", "justify-content-center");
					div.innerText = getLang(context, "pages.playResult.noPlayers");
					pongResultPlayers.appendChild(div);
				} else
					for (let player of data.stats) {
						if (!player)
							continue;
						let pic = player.user ? player.user.picture : null;
						let usr = player.user ? player.user.username : "Unknown";
						let div = document.createElement("div");
						div.classList.add("PongResult-player", "row", "justify-content-center");
						div.innerHTML = /*html*/`
							<img src="${pic || "/static/img/user.svg"}" alt="${getLang(context, "pages.playResult.profilePictureAlt")}" class="row">
							<a class="fs-4 fw-semibold row">${usr}</a>
							<span class="fs-5 row" style="font-size: 1em !important;">${player.score} pts</span>
						`;
						div.style.cursor = "pointer";
						if (usr !== "Unknown")
							div.onclick = () => redirect(`/profile/${usr}`);
						pongResultPlayers.appendChild(div);
					}
			});
		}
	}, 200);
	return div.outerHTML;
}


export { PongResult };
