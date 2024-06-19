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
import { Persistents } from "../components/Persistents.js";
import { getLang } from "../script.js";

function PongResult(context, id) {
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
							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">9 pts</span>
							</div>

							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">8 pts</span>
							</div>

							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">7 pts</span>
							</div>

							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">6 pts</span>
							</div>

							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">5 pts</span>
							</div>

							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">4 pts</span>
							</div>

							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">3 pts</span>
							</div>

							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">2 pts</span>
							</div>

							<div class="PongResult-player row justify-content-center">
								<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture" class="">
								<a href="/profile/username" class="fs-4 fw-semibold">username</a>
								<span class="fs-5">1 pts</span>
							</div>
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
		}

	}, 200);
	return div.outerHTML;
}

export { PongResult };
