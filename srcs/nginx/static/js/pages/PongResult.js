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
import { getGameMode, getJson, setupCopyKBDSpan } from "../utils.js";
import { PlayId } from "./PlayId.js";
import { Chat } from "../components/Chat.js";


async function PongResult(context, id, data=null) {
	if (data === null)
		return await PlayId(context, id);
	let div = document.createElement("div");

	div.innerHTML += /*html*/`
		<div id="PongResult-content">
			<div class="PongResult-container container-blur" style="padding: 20px; margin-top: 50px;">
				<div class="PongResult-winner d-flex justify-content-center justify-content-around align-items-center">
					<img src="/static/img/crown.svg" class="d-none d-md-block" style="border-radius: 0;">
					<img id="best-picture" src="/static/img/user.svg" alt="${getLang(context, "pages.playResult.profilePictureAlt")}" class="d-none d-sm-block">
					<a id="best-username" href="/profile/username" class="linear-wipe fs-1 fw-bold text-center">${getLang(context, "loading")}</a>
					<span id="best-score" class="linear-wipe fs-4 text-start mt-2">42 pts</span>
					<img src="/static/img/crown.svg" class="d-none d-md-block" style="border-radius: 0;">
				</div>
				<div class="container-fluid">
					<div id="game-mode" class="d-flex justify-content-center fs-2">${getLang(context, "loading")}</div>
					<div class="GameConfig-Line my-3"></div>
					<div class="container-fluid d-flex justify-content-center">
						<div class="kbd-span">
							<span class="pointer notSelectable" id="game-uid">${getLang(context, "loading")}</span>
							<span class="pointer notSelectable" id="game-icon">⌛</span>
						</div>
					</div>

					<div id="pongResult-item" class="py-2" style="margin-top: 20px;">
						<div class="row" style="padding-bottom: 35px; margin-left: 24%; margin-right: 24%;">
							<div class="pongResult-Streak text-center col-6">
								<div class="pongResult-Streak d-flex justify-content-center">
									<img src="/static/img/fire.svg" class="">
									<div class="circle-streak"></div>
									<span id="best-streak" class="fw-bold fs-1">0</span>
								</div>
								<label class="pongResult-BestStreak fw-bold pt-4">${getLang(context, "pages.playResult.bestStreak")}</label>
								<br>
								<label class="result-by">
									${getLang(context, "pages.playResult.by")}
									<span class="result-by-user" id="best-streak-by">doc</span>
								</label>
							</div>
							<div class="pongResult-Time text-center col-6">
								<div class="pongResult-Time d-flex justify-content-center">
									<img src="/static/img/hourglass.svg" class="">
									<div class="circle-time"></div>
									<span id="best-time" class="fw-bold fs-5">00:00</span>
								</div>
								<label class="pongResult-BestTime fw-bold pt-4">${getLang(context, "pages.playResult.bestTime")}</label>
								<br>
								<label class="result-by">
									${getLang(context, "pages.playResult.by")}
									<span class="result-by-user" id="best-time-by">doc</span>
								</label>
							</div>
						</div>
						<div class="row" style="padding-bottom: 20px; margin-left: 8%; margin-right: 8%;">
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

	div.insertBefore(Persistents(context), div.firstChild);
	div.insertBefore(await NavBar(getLang(context, "pages.playResult.title"), context), div.firstChild);
	div.appendChild(Chat(context));

		let bestPicture = div.querySelector("#best-picture");
		let bestUsername = div.querySelector("#best-username");
		let bestScore = div.querySelector("#best-score");
		let bestStreak = div.querySelector("#best-streak");
		let bestStreakBy = div.querySelector("#best-streak-by");
		let rebounds = div.querySelector("#rebounds");
		let reboundsBy = div.querySelector("#rebounds-by");
		let ultimateSpeed = div.querySelector("#ultimate-speed");
		let ultimateSpeedBy = div.querySelector("#ultimate-speed-by");
		let bestTime = div.querySelector("#best-time");
		let bestTimeBy = div.querySelector("#best-time-by");
		let gameMode = div.querySelector("#game-mode");
		let gameUid = div.querySelector("#game-uid");
		let gameIcon = div.querySelector("#game-icon");
		let pongResultPlayers = div.querySelector(".PongResult-players");

		if (data.mode)
			gameMode.innerText = getGameMode(data.mode);
		if (data.uid) {
			gameUid.innerText = `#${data.uid}`;
			setupCopyKBDSpan(data.uid, gameIcon, [ gameUid ]);
		}
		if (data.winner) {
			if (data.winner.user) {
				if (data.winner.user.picture)
					bestPicture.src = data.winner.user.picture;
				bestUsername.href = `/profile/${data.winner.user.username}`;
				bestUsername.innerText = data.winner.user.username;
			}
			if (data.mode !== "BR")
				bestScore.innerText = data.winner.score + " pts"
			else {
				let min = Math.floor(data.winner.duration / 60);
				let sec = Math.floor(data.winner.duration % 60);
				bestScore.innerText = (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
			}
		}
		if (data.bestStreak) {
			bestStreak.innerText = data.bestStreak.score;
			if (data.bestStreak.user)
				bestStreakBy.innerText = data.bestStreak.user.username;
			else
				bestStreakBy.parentElement.style.display = "none";
		}
		if (data.rebounces) {
			rebounds.innerText = data.rebounces.rebounces;
			if (data.rebounces.user)
				reboundsBy.innerText = data.rebounces.user.username;
			else
				reboundsBy.parentElement.style.display = "none";
		}
		if (data.ultimate) {
			ultimateSpeed.innerText = Math.round(data.ultimate.ultimate * 100) / 100;
			if (data.ultimate.user)
				ultimateSpeedBy.innerText = data.ultimate.user.username;
			else
				ultimateSpeedBy.parentElement.style.display = "none";
		}
		if (data.duration) {
			let min = Math.floor(data.duration.duration / 60);
			let sec = Math.floor(data.duration.duration % 60);
			bestTime.innerText = `${min < 10 ? "0" : ""}${min}:${sec < 10 ? "0" : ""}${sec}`;
			if (data.mode === "BR" && data.duration.user)
				bestTimeBy.innerText = data.duration.user.username;
			else
				bestTimeBy.parentElement.style.display = "none";
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

			let game = data;
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
					if (game.mode === "BR")
						data.stats = data.stats.sort((a, b) => b.duration - a.duration);
					else
						data.stats = data.stats.sort((a, b) => a.score - b.score);
					for (let player of data.stats) {
						if (!player)
							continue;
						let pic = player.user ? player.user.picture : null;
						let usr = player.user ? player.user.username : "Unknown";
						let score = null;
						if (game.mode !== "BR")
							score = player.score + " pts"
						else {
							let min = Math.floor(player.duration / 60);
							let sec = Math.floor(player.duration % 60);
							score = (min < 10 ? "0" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
						}
						let div = document.createElement("div");
						div.classList.add("PongResult-player", "row", "justify-content-center");
						div.innerHTML = /*html*/`
							<img src="${pic || "/static/img/user.svg"}" alt="${getLang(context, "pages.playResult.profilePictureAlt")}" class="row">
							<a class="fs-4 fw-semibold row">${usr}</a>
							<span class="fs-5 row" style="font-size: 1em !important;">${score}</span>
						`;
						div.style.cursor = "pointer";
						if (usr !== "Unknown")
							div.onclick = () => redirect(`/profile/${usr}`);
						pongResultPlayers.appendChild(div);
					}
			});
		}
	return div;
}


export { PongResult };
