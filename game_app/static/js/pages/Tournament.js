/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Tournament.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/26 16:45:15 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/04 03:47:02 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, redirect, refresh } from "../script.js";
import { getJson } from "../utils.js";


var DIV_H = 125;
var DIV_W = 80;

async function Tournament(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Tournament", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<div id="tournament-content" class="block-blur">
			<div class="block-blur-pad"></div>
			<div class="container-fluid">
				<div class="container-fluid" id="tournament-container">
				</div>
			</div>
			<div class="block-blur-pad"></div>
		</div>
	`;
	setTimeout(async () => {
		let container = document.getElementById("tournament-container");
		if (!container) {
			setTimeout(() => refresh(context), 1000);
			return;
		}

		let title = document.createElement("h1");

		let data = await getJson(context, "/api/tounament/get");
		if (data.ok) {
			if (data.length == 0) {
				title.innerText = getLang(context, "pages.tournament.noTournament");
				container.parentElement.insertBefore(title, container);
				return;
			}
			data = {...data, ...data.tournaments[0]};
			title.innerText = "#" + data.tid;
			container.parentElement.insertBefore(title, container);
		} else {
			persistError(context, getLang(context, data.error));
			pushPersistents(context);
			return;
		}

		for (let i = 0; i < data.pools.length; i++)
			for (let j = 0; j < data.pools[i].matches.length; j++)
				for (let k = 0; k < data.pools[i].matches[j].players.length; k++) {
					let username = data.pools[i].matches[j].players[k];
					let user = await getJson(context, `/api/user/${username}`);
					if (user && user.ok)
						data.pools[i].matches[j].players[k] = user;
					else
						data.pools[i].matches[j].players[k] = { username: username };
				}

		let pools = calcPools(data.playerCount);
		pools.push([1, 1]);

		console.log("Pools:", pools);

		let pos = [];
		let newPos = [];
		for (let i = 0; i < pools.length; i++) {
			let x = i * DIV_W * 4;
			let y = 0;
			for (let j = 0; j < pools[i][0]; j++) {
				let averageY = 0;
				for (let k = 0; k < pools[i][1]; k++) {
					let pool = data.pools.length <= i ? null : data.pools[i];
					let match = !pool || pool.matches.length <= j ? null : pool.matches[j];
					let player = !match || match.players.length <= k ? null : match.players[k];
					let winnerIdx = null;
					if (match && match.winner != null) {
						for (let l = 0; l < match.players.length; l++)
							if (match.players[l].username == match.winner) {
								winnerIdx = l;
								break;
							}
					}
					let isEliminated = winnerIdx != null && winnerIdx != k;
					
					if (i == 0)
						y += 10;
					else
						y = pos[j * pools[i][1] + k];
					if (k == 0)
						averageY = y;
					if (k == pools[i][1] - 1)
						averageY = (averageY + y) / 2;
					if (i != 0) {
						let oldMatch = data.pools.length <= i - 1 || data.pools[i - 1] == null ? null : data.pools[i - 1].matches[j * pools[i][1] + k];
						createLink(container, x - DIV_W * 1.5, y + DIV_H / 2, i - 1, j * pools[i][1] + k, undefined,
							oldMatch && oldMatch.status == "finished");
						createBall(container, x - DIV_W * 1.5, y + DIV_H / 2, i - 1, j * pools[i][1] + k,
							oldMatch && (oldMatch.status != "pending" || oldMatch.players.length == oldMatch.playerCount));
						if (i - 1 <= data.currentPool)
							createTool(container, x - DIV_W * 1.5, y + DIV_H / 2, i - 1, j * pools[i][1] + k,
								pools[i - 1][1], oldMatch);
					}
					createUser(container, x, y, i, j, k, player, isEliminated);
					if (i != pools.length - 1) {
						createLink(container, x + DIV_W, y + DIV_H / 2, i, j, k,
							player != null && (winnerIdx == null || winnerIdx == k), isEliminated);
						setTimeout((i, j, k, x, y) => {
							let ball = document.getElementById(`ball-${i}-${j}`);
							let ballY = parseInt(ball.style.top.replace("px", ""));
							let yy;
							let height;
							if ((k + 1) * 2 > pools[i][1]) {
								yy = ballY;
								height = y - ballY + DIV_H / 2 + 6;
							} else if (((k + 1) * 2 < pools[i][1]) || (pools[i][1] % 2 == 0 && (k + 1) * 2 == pools[i][1])) {
								yy = y + DIV_H / 2;
								height = ballY - yy + 6;
							}
							createVerticalLink(container, x + DIV_W * 2.5, yy, height, i, j, k,
								player != null && (winnerIdx == null || winnerIdx == k), isEliminated);
						}, 50, i, j, k, x, y);
					}
					y += DIV_H + 10;
				}
				newPos.push(averageY);
			}
			pos = newPos;
			newPos = [];
		}

		let width = (pools.length - 1) * DIV_W * 4 + DIV_W;
		container.style.width = width + "px";
		container.style.margin = "auto";
	}, 250);
	return div.innerHTML;
}

function createUser(container, x, y, pool, match, idx, player = null, eliminated = false) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<img class="user-picture" src="${player && player.picture ? player.picture : './static/img/user.svg'}" alt="Profile picture">
		<span class="user-name">${player ? player.username : ''}</span>
	`;
	container.appendChild(div);
	div.classList.add("user");
	if (eliminated)
		div.classList.add("eliminated");
	div.id = `user-${pool}-${match}-${idx}`;
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	div.setAttribute("data-idx", idx);
	div.onclick = () => {
		console.log(`user-${pool}-${match}-${idx}  |  x: ${x}  y: ${y}  | `, player);
		if (div.hasAttribute("selected"))
			div.removeAttribute("selected");
		else
			div.setAttribute("selected", true);
		if (player)
			redirect(`/profile/${player.username}`);
	};
	div.style.left = x + "px";
	div.style.top = y + "px";
	return div;
}

function createBall(container, x, y, pool, match, active = false) {
	let div = document.createElement("div");
	container.appendChild(div);
	div.classList.add("ball");
	if (active)
		div.classList.add("active");
	div.id = `ball-${pool}-${match}`;
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	div.onclick = () => {
		console.log(`ball-${pool}-${match}  |  x: ${x}  y: ${y}`);
		if (div.hasAttribute("selected"))
			div.removeAttribute("selected");
		else
			div.setAttribute("selected", true);
	};
	div.style.left = x + "px";
	div.style.top = y + "px";

	div.onmouseenter = () => {
		let animationDuration = 0.3;
		let tooltip = document.getElementById(`game-${pool}-${match}`);
		let tooltipContainer = tooltip ? tooltip.querySelector(".tooltip-container") : null;
		let tooltipContent = tooltip ? tooltip.querySelector(".tooltip-content") : null;
		if (tooltip && tooltipContainer) {
			if (div.getAttribute("cooldown") == "true")
				return;
			div.setAttribute("cooldown", true);
			if (tooltipContent)
				tooltipContent.style.opacity = "0";
			tooltip.style.display = "block";
			tooltipContainer.style.animation = "none";
			tooltipContainer.offsetHeight; // trigger reflow
			tooltipContainer.style.animation = `tournament-appear ${animationDuration + .1}s`;
			setTimeout(() => {
				if (tooltipContent) {
					let interval = setInterval(() => {
						let opacity = parseFloat(tooltipContent.style.opacity);
						if (opacity < 1)
							tooltipContent.style.opacity = `${opacity + 0.03}`;
						else {
							tooltipContent.style.opacity = "1";
							clearInterval(interval);
						}
					}, 1);
				}
				tooltipContainer.style.animation = "none";
				tooltipContainer.offsetHeight; // trigger reflow
				tooltip.onmouseleave = () => {
					if (tooltip.getAttribute("cooldown") == "true")
						return;
					tooltip.setAttribute("cooldown", true);
					if (tooltipContent) {
						let interval = setInterval(() => {
							let opacity = parseFloat(tooltipContent.style.opacity);
							if (opacity > 0)
								tooltipContent.style.opacity = `${opacity - 0.03}`;
							else {
								tooltipContent.style.opacity = "0";
								clearInterval(interval);
							}
						}, 1);
					}
					setTimeout(() => {
						tooltipContainer.style.animation = "none";
						tooltipContainer.offsetHeight; // trigger reflow
						tooltipContainer.style.animation = `tournament-disappear ${animationDuration + .1}s`;
						setTimeout(() => {
							tooltipContainer.style.animation = "none";
							tooltipContainer.offsetHeight; // trigger reflow
							tooltip.style.display = "none";
							tooltip.setAttribute("cooldown", false);
							div.setAttribute("cooldown", false);
						}, animationDuration * 1000);
					}, 500);
				};
			}, animationDuration * 1000);
		}
	};
	return div;
}

function createTool(container, x, y, pool, match, playerCount = 0, game = null) {
	if (!game)
		game = { uid: null, playerCount: playerCount, status: "waiting" };
	let div = document.createElement("div");
	container.appendChild(div);
	div.classList.add("game-tooltip");
	div.id = `game-${pool}-${match}`;
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	div.onclick = () => {
		console.log(`game-${pool}-${match}  |  x: ${x}  y: ${y}`);
		if (div.hasAttribute("selected"))
			div.removeAttribute("selected");
		else
			div.setAttribute("selected", true);
		let ball = document.getElementById(`ball-${pool}-${match}`);
		if (ball)
			ball.onclick();
		if (game.uid)
			redirect(`/play/${game.uid}`);
	};
	if (game.uid)
		div.style.cursor = "pointer";
	div.style.left = x + "px";
	div.style.top = y + "px";
	div.style.display = "none";
	div.innerHTML = /*html*/`
		<div class="container-blur tooltip-container">
			<div class="container-fluid tooltip-content">
				<div class="tooltip-line">
					<span class="tooltip-label tooltip-uid">UID:</span>
					<span class="tooltip-value tooltip-uid">${game.uid ? "#" + game.uid : "..."}</span>
				</div>
				<div class="tooltip-line">
					<span class="tooltip-label tooltip-players">Players:</span>
					<span class="tooltip-value tooltip-players">${game.playerCount}</span>
				</div>
				<div class="tooltip-line">
					<span class="tooltip-label tooltip-status">Status:</span>
					<span class="tooltip-value tooltip-status">${game.status}</span>
				</div>
			</div>
		</div>
	`;
	return div;
}

function createLink(container, x, y, pool, match, idx = undefined, active = false, isEliminated) {
	let div = document.createElement("div");
	container.appendChild(div);
	div.classList.add("link");
	if (active)
		div.classList.add("active");
	if (isEliminated)
		div.classList.add("eliminated");
	div.id = `link-${pool}-${match}` + (idx !== undefined ? `-${idx}` : "");
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	if (idx !== undefined)
		div.setAttribute("data-idx", idx);
	div.onclick = () => {
		console.log(`link-${pool}-${match}` + (idx !== undefined ? `-${idx}` : "") + `  |  x: ${x}  y: ${y}`);
		if (div.hasAttribute("selected"))
			div.removeAttribute("selected");
		else
			div.setAttribute("selected", true);
		let vert = document.getElementById(`link-vert-${pool}-${match}-${idx}`);
		if (vert) {
			if (vert.hasAttribute("selected"))
				vert.removeAttribute("selected");
			else
				vert.setAttribute("selected", true);
		}
	};
	div.style.left = x + "px";
	div.style.top = y + "px";
	return div;
}

function createVerticalLink(container, x, y, height, pool, match, idx, active = false, isEliminated = false) {
	let div = document.createElement("div");
	container.appendChild(div);
	div.classList.add("link", "vertical");
	if (active)
		div.classList.add("active");
	if (isEliminated)
		div.classList.add("eliminated");
	div.id = `link-vert-${pool}-${match}-${idx}`;
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	div.setAttribute("data-idx", idx);
	div.onclick = () => {
		console.log(`link-vert-${pool}-${match}-${idx}  |  x: ${x}  y: ${y}`);
		if (div.hasAttribute("selected"))
			div.removeAttribute("selected");
		else
			div.setAttribute("selected", true);
		let hor = document.getElementById(`link-${pool}-${match}-${idx}`);
		if (hor) {
			if (hor.hasAttribute("selected"))
				hor.removeAttribute("selected");
			else
				hor.setAttribute("selected", true);
		}
	};
	div.style.left = x + "px";
	div.style.top = y + "px";
	div.style.height = (height) + "px";
	return div;
}

function decompose(num) {
	let factors = [];
	let divisor = 2;
	while (num > 1) {
		while (num % divisor == 0) {
			factors.push(divisor);
			num /= divisor;
		}
		divisor += 1;
	}
	return factors.reverse();
}

function calcPools(playerCount) {
	let factors = decompose(playerCount);
	let pools = [];
	for (let i = 0; i < factors.length; i++) {
		playerCount /= factors[i];
		pools.push([playerCount, factors[i]]);
	}
	return pools;
}


export { Tournament };
