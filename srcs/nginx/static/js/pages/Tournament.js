/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Tournament.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42angouleme.fr>     +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/26 16:45:15 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/26 10:34:46 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, persistSuccess, redirect, refresh } from "../script.js";
import { getJson, randomUUIDv4, setupCopyKBDSpan } from "../utils.js";


var DIV_H = 125;
var DIV_W = 80;

async function Tournament(context, tid, data = null) {
	let div = document.createElement("div");
	div.innerHTML += /*html*/`
		<div id="signature" style="display: none;">${randomUUIDv4()}</div>

		<div id="title">
			<div class="kbd-span" id="title">
				<h1 class="pointer notSelectable" id="game-uid">...</h1>
				<span class="pointer notSelectable" id="game-icon">⌛</span>
			</div>
		</div>

		<div id="game-status">...</div>

		<div class="container-fluid" id="tournament-container">
		</div>

		<a href="/tournament" data-link><button id="go-to-new" class="btn btn-outline-secondary"><span>⤆<span></button></a>
	`;

	setTimeout(async () => {
		let signature = document.getElementById("signature");
		let container = document.getElementById("tournament-container");
		let title = document.getElementById("title");
		let titleH1 = document.getElementById("game-uid");
		let titleIcon = document.getElementById("game-icon");
		let status = document.getElementById("game-status");

		if (!signature || !container || !title || !titleH1  || !titleIcon || !status) {
			setTimeout(() => refresh(context), 1000);
			return;
		}

		signature = signature.innerText;

		let selectedElements = [];

		if (!data)
			data = await getJson(context, `/api/tournament/${tid}`);

		drawWindow(context, data, tid, container, title, titleH1, titleIcon, selectedElements, status);

		repeat(signature, context, data, tid,
			container, title, titleH1, titleIcon, selectedElements, status);
	}, 200);
	return div.innerHTML;
}

async function repeat(signature, context, data, tid,
	container, title, titleH1, titleIcon, selectedElements, status) {
	setTimeout(async () => {
		console.log("Refreshing tournament data...");
		let sig = document.getElementById("signature");
		if (!sig || sig.innerText !== signature) {
			console.log("Stopped refreshing tournament data.");
			return;
		}
		let newData = await getJson(context, `/api/tournament/${tid}`);

		let same = false;
		if (newData.status === data.status
			&& newData.ended === data.ended
			&& newData.currentPool === data.currentPool
			&& newData.players.length === data.players.length)
			same = true;
		if (same)
			for (let i = 0; i < newData.pools.length; i++) {
				if (!same)
					break;
				for (let j = 0; j < newData.pools[i].matches.length; j++) {
					let newMatch = newData.pools[i].matches[j];
					let match = i >= data.pools.length || j >= data.pools[i].matches.length ? null : data.pools[i].matches[j];
					if (!match || newMatch.status !== match.status
						|| newMatch.players.length !== match.players.length) {
						same = false;
						break;
					}
				}
			}

		if (!same) {
			data = newData;
			container.innerHTML =  "";
			drawWindow(context, data, tid, container, title, titleH1, titleIcon, selectedElements, status);
		}

		repeat(signature, context, data, tid,
			container, title, titleH1, titleIcon, selectedElements, status);
	}, data.status === "P" ? 2000 : 5000);
}

async function drawWindow(context, data, tid,
		container, title, titleH1, titleIcon, selectedElements, status) {
	if (data && data.ok) {
		titleH1.innerText = "#" + data.tid;
		setupCopyKBDSpan(data.tid, titleIcon, [ titleH1 ]);
	} else {
		titleH1.innerText = `#${tid}`;
		titleIcon.innerText = "❌";
		container.innerHTML += /*html*/`
			<br><br><br>
			<h1 class="notSelectable">${getLang(context, "pages.tournament.noTournament")}</h1>
				<hr style="margin-top: 30px; margin-bottom: 15px">
				<p>${getLang(context, "pages.tournament.noTournamentDesc")}</p>
			<a class="no-style btn btn-outline-warning" href="/tournament" data-link>${getLang(context, "pages.tournament.create")}</a>
		`;
		if (data) {
			persistError(context, getLang(context, data.error));
			pushPersistents(context);
		}
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

	updateStatus(status, data);
	drawGraph(selectedElements, container, data, pools);
	ifPending(context, container, data, pools, tid);
	selectElements(selectedElements);
}

function updateStatus(status, data) {
	status.classList.remove("pending");
	status.classList.remove("ongoing");
	status.classList.remove("finished");
	if (data.ended) {
		status.classList.add("finished");
		status.innerText = getLang(context, "pages.tournament.finished");
	} else if (data.status === "P") {
		status.classList.add("pending");
		status.innerText = getLang(context, "pages.tournament.pending");
	} else if (data.status === "O") {
		status.classList.add("ongoing");
		status.innerText = getLang(context, "pages.tournament.ongoing");
	} else
		status.innerText = data.status;
}

async function ifPending(context, container, data, pools, tid) {
	if (data.status === "P") {
		if (data.players.includes(context.user.username)) {
			let quitButton = document.createElement("button");
			quitButton.classList.add("btn", "btn-outline-danger");
			quitButton.id = "quit-button";
			quitButton.innerText = getLang(context, "pages.tournament.quit");
			quitButton.onclick = async () => {
				let data = await getJson(context, `/api/tournament/${tid}/quit/${context.user.username}`);
				if (data.ok) {
					persistSuccess(context, getLang(context, data.success));
					refresh(context);
				} else {
					persistError(context, getLang(context, data.error));
					pushPersistents(context);
				}
			};
			container.appendChild(quitButton);
		} else {
			let joinButton = document.createElement("button");
			joinButton.classList.add("btn", "btn-outline-info");
			joinButton.id = "join-button";
			joinButton.innerText = getLang(context, "pages.tournament.join");
			joinButton.onclick = async () => {
				let data = await getJson(context, `/api/tournament/${tid}/join/${context.user.username}`);
				if (data.ok) {
					persistSuccess(context, getLang(context, data.success));
					refresh(context);
				} else {
					persistError(context, getLang(context, data.error));
					pushPersistents(context);
				}
			};
			container.appendChild(joinButton);
		}

		setTimeout(async () => {
			let i = 0;
			let j = 0;
			for (let p = 0; p < data.players.length; p++) {
				let username = data.players[p];
				let player = await getJson(context, `/api/user/${username}`);
				if (!player.ok)
					player = { username: username };

				let user = document.getElementById(`user-0-${j}-${i}`);
				if (user) {
					let picture = user.querySelector(".user-picture");
					let usernameLabel = user.querySelector(".user-name");
					let func = user.onclick;

					if (picture && player.picture)
						picture.src = player.picture;
					if (usernameLabel)
						usernameLabel.innerText = player.username;
					user.onclick = () => {
						func();
						redirect(`/profile/${player.username}`);
					};
				}
				i++;
				if (i == pools[0][1]) {
					i = 0;
					j++;
				}
			}
		}, 50);
	}
}

function drawGraph(selectedElements, container, data, pools) {
	console.log(data);
	console.log(pools);

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
				if (i == pools.length - 1 && data.ended)
					player = data.winner;
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
					createLink(container, selectedElements, x - DIV_W * 1.5, y + DIV_H / 2, i - 1, j * pools[i][1] + k, undefined,
						(oldMatch && oldMatch.status == "F") || data.ended);
					createBall(container, selectedElements, x - DIV_W * 1.5, y + DIV_H / 2, i - 1, j * pools[i][1] + k,
						i - 1 <= data.currentPool && oldMatch && (oldMatch.status != "P" || oldMatch.players.length == oldMatch.playerCount));
					if (i - 1 <= data.currentPool)
						createTool(container, selectedElements, x - DIV_W * 1.5, y + DIV_H / 2, i - 1, j * pools[i][1] + k,
							pools[i - 1][1], oldMatch);
				}
				createUser(container, selectedElements, x, y, i, j, k, player, isEliminated);
				if (i != pools.length - 1) {
					createLink(container, selectedElements, x + DIV_W, y + DIV_H / 2, i, j, k,
						player != null && (winnerIdx == null || winnerIdx == k), isEliminated);
					setTimeout((i, j, k, x, y) => {
						let ball = document.getElementById(`ball-${i}-${j}`);
						if (!ball)
							return;
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
						createVerticalLink(container, selectedElements, x + DIV_W * 2.5, yy, height, i, j, k,
							player != null && (winnerIdx == null || winnerIdx == k), isEliminated);
					}, 100, i, j, k, x, y);
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
}

function selectElements(selectedElements) {
	setTimeout(() => {
		for (let i = 0; i < selectedElements.length; i++) {
			let element = document.getElementById(selectedElements[i]);
			if (element)
				element.setAttribute("selected", true);
		}
	}, 100);
}

function createUser(container, selectedElements, x, y, pool, match, idx, player = null, eliminated = false) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<img class="user-picture" src="${player && player.picture ? player.picture : '/static/img/user.svg'}" alt="Profile picture">
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
		console.log(`${div.id}  |  x: ${x}  y: ${y}  | `, player);
		if (div.hasAttribute("selected")) {
			div.removeAttribute("selected");
			selectedElements.splice(selectedElements.indexOf(div.id), 1);
		} else {
			div.setAttribute("selected", true);
			selectedElements.push(div.id);
		}
		if (player)
			redirect(`/profile/${player.username}`);
	};
	div.style.left = x + "px";
	div.style.top = y + "px";
	return div;
}

function createBall(container, selectedElements, x, y, pool, match, active = false) {
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
		console.log(`${div.id}  |  x: ${x}  y: ${y}`);
		if (div.hasAttribute("selected")) {
			div.removeAttribute("selected");
			selectedElements.splice(selectedElements.indexOf(div.id), 1);
		} else {
			div.setAttribute("selected", true);
			selectedElements.push(div.id);
		}
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

function createTool(container, selectedElements, x, y, pool, match, playerCount = 0, game = null) {
	if (!game)
		game = { game: null, playerCount: playerCount, status: "waiting" };
	let div = document.createElement("div");
	container.appendChild(div);
	div.classList.add("game-tooltip");
	div.id = `game-${pool}-${match}`;
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	div.onclick = () => {
		console.log(`${div.id}  |  x: ${x}  y: ${y}`);
		if (div.hasAttribute("selected")) {
			div.removeAttribute("selected");
			selectedElements.splice(selectedElements.indexOf(div.id), 1);
		} else {
			div.setAttribute("selected", true);
			selectedElements.push(div.id);
		}
		let ball = document.getElementById(`ball-${pool}-${match}`);
		if (ball)
			ball.onclick();
		if (game.game)
			redirect(`/play/${game.game}`);
	};
	if (game.game)
		div.style.cursor = "pointer";
	div.style.left = x + "px";
	div.style.top = y + "px";
	div.style.display = "none";
	div.innerHTML = /*html*/`
		<div class="container-blur tooltip-container">
			<div class="container-fluid tooltip-content">
				<div class="tooltip-line">
					<span class="tooltip-label tooltip-uid">UID:</span>
					<span class="tooltip-value tooltip-uid">${game.game ? "#" + game.game : "..."}</span>
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

function createLink(container, selectedElements, x, y, pool, match, idx = undefined, active = false, isEliminated) {
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
		let vert = document.getElementById(`link-vert-${pool}-${match}-${idx}`);

		console.log(div.id + `  |  x: ${x}  y: ${y}`);
		if (div.hasAttribute("selected")) {
			div.removeAttribute("selected");
			selectedElements.splice(selectedElements.indexOf(div.id), 1);

			if (vert) {
				vert.removeAttribute("selected");
				selectedElements.splice(selectedElements.indexOf(vert.id), 1);
			}
		} else {
			div.setAttribute("selected", true);
			selectedElements.push(div.id);

			if (vert) {
				vert.setAttribute("selected", true);
				selectedElements.push(vert.id);
			}
		}
	};
	div.style.left = x + "px";
	div.style.top = y + "px";
	return div;
}

function createVerticalLink(container, selectedElements, x, y, height, pool, match, idx, active = false, isEliminated = false) {
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
		let hor = document.getElementById(`link-${pool}-${match}-${idx}`);

		console.log(`${div.id}  |  x: ${x}  y: ${y}`);
		if (div.hasAttribute("selected")) {
			div.removeAttribute("selected");
			selectedElements.splice(selectedElements.indexOf(div.id), 1);

			if (hor) {
				hor.removeAttribute("selected");
				selectedElements.splice(selectedElements.indexOf(hor.id), 1);
			}
		} else {
			div.setAttribute("selected", true);
			selectedElements.push(div.id);

			if (hor) {
				hor.setAttribute("selected", true);
				selectedElements.push(hor.id);
			}
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
