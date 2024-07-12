/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Pong.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:20 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:20 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { initScene } from "../pong_game/main.js";
import { getGameMode, setupCopyKBDSpan } from "../utils.js";


async function Pong(context, uid, data) {
	let div = document.createElement("div");

	div.innerHTML = /*html*/`
		<style type="text/css">
			canvas {
				position: fixed;
				top: 0;
				z-index: -1;
			}
		</style>
	`;
	if (data && data.waiting) {
		let mode = getGameMode(data.mode);
		div.innerHTML += /*html*/`
			<div id="playid-content">
				<div class="container-fluid container-blur content">
					<div class="moving-point"></div>
					<div class="row">
						<span class="text-center fs-2 GameMode mt-4">${mode}</span>
						<div class="GameConfig-Line my-3"></div>
						<div class="container-fluid d-flex justify-content-center">
							<div class="kbd-span">
								<span class="pointer notSelectable" id="game-uid">#${uid}</span>
								<span class="pointer notSelectable" id="game-icon">⌛</span>
							</div>
						</div>
						<div class="text-center search-text fs-1">...</div>
						<div class="row fs-3 justify-content-center">
							<p class="col-1" id="current-amount">0</p>
							<p class="col-1">/</p>
							<p class="col-1" id="total-amount">0</p>
						</div>
					</div>
				</div>
			</div>
		`;
	}
	div.appendChild(await NavBar("Profile", context), div.firstChild);
	div.appendChild(Persistents(context), div.firstChild);

	let gameUid = div.querySelector("#game-uid");
	let gameIcon = div.querySelector("#game-icon");
	let search = div.querySelector(".search-text");

	if (gameUid && gameIcon)
		setupCopyKBDSpan(uid, gameIcon, [ gameUid ]);

	if (search) {
		search.innerHTML = "";
		let searchText = "Searching...";
		for (let i = 0; i < searchText.length; i++) {
			let span = document.createElement("span");
			span.innerText = searchText[i];
			span.style.animationDelay = `${i * 0.1 + 1}s`;
			search.appendChild(span);
		}
	}
	await initScene(uid);
	return div;
}

function setWaitingTotalPlayerCount(amount) {
	let elem = document.getElementById("total-amount");
	if (elem)
		elem.innerHTML = amount;
}

function incrementWaitingPlayerCount() {
	let elem = document.getElementById("current-amount");
	if (elem) {
		let count = parseInt(elem.innerHTML);
		if (isNaN(count))
			elem.innerHTML = 1;
		else
			elem.innerHTML = count + 1;
	}
}

function remWaiting() {
	let elem = document.getElementById("playid-content");
	if (elem)
		elem.remove();
}


export { Pong, remWaiting, setWaitingTotalPlayerCount, incrementWaitingPlayerCount };
