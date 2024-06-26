/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Tournament.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/26 16:45:15 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/26 16:55:20 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";


var DIV_H = 125;
var DIV_W = 80;

async function Tournament(context, playerCount = 30) {
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
	setTimeout(() => {
		let container = document.getElementById("tournament-container");
		let pools = calcPools(playerCount);
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
					if (i == 0)
						y += 10;
					else
						y = pos[j * pools[i][1] + k];
					if (k == 0)
						averageY = y;
					if (k == pools[i][1] - 1) {
						if (i != pools.length - 1) {
							createVerticalLink(container, x + DIV_W * 2.5, averageY + DIV_H / 2, (y - averageY) / 2, i, j, 0);
							createVerticalLink(container, x + DIV_W * 2.5, averageY + DIV_H / 2 + (y - averageY) / 2, (y - averageY) / 2, i, j, 1);
						}
						averageY = (averageY + y) / 2;
					}
					if (i != 0) {
						console.log(i, j, k);
						createLink(container, x - DIV_W * 1.5, y + DIV_H / 2, i - 1, j * pools[i - 1][1] + k);
						createBall(container, x - DIV_W * 1.5, y + DIV_H / 2, i - 1, j * pools[i - 1][1] + k);
					}
					createUser(container, x, y, i, j, k);
					if (i != pools.length - 1)
						createLink(container, x + DIV_W, y + DIV_H / 2, i, j, k);
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

		let pool0 = document.querySelectorAll("div[data-pool='0']");
		pool0.forEach(user => {
			user.classList.add("active");
		});
	}, 250);
	return div.innerHTML;
}

function createUser(container, x, y, pool, match, idx) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<img class="user-picture" src="./static/img/user.svg" alt="Profile picture">
		<span class="user-name"></span>
	`;
	container.appendChild(div);
	div.classList.add("user");
	div.id = `user-${pool}-${match}-${idx}`;
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	div.setAttribute("data-idx", idx);
	div.onclick = () => console.log(`user-${pool}-${match}-${idx}  |  x: ${x}  y: ${y}`);
	div.style.left = x + "px";
	div.style.top = y + "px";
	return div;
}

function createBall(container, x, y, pool, match) {
	let div = document.createElement("div");
	container.appendChild(div);
	div.classList.add("ball");
	div.id = `ball-${pool}-${match}`;
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	div.onclick = () => console.log(`ball-${pool}-${match}  |  x: ${x}  y: ${y}`);
	div.style.left = x + "px";
	div.style.top = y + "px";
	return div;
}

function createLink(container, x, y, pool, match, idx = undefined) {
	let div = document.createElement("div");
	container.appendChild(div);
	div.classList.add("link");
	div.id = `link-${pool}-${match}` + (idx !== undefined ? `-${idx}` : "");
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	if (idx !== undefined)
		div.setAttribute("data-idx", idx);
	div.onclick = () => console.log(`link-${pool}-${match}` + (idx !== undefined ? `-${idx}` : "") + `  |  x: ${x}  y: ${y}`);
	div.style.left = x + "px";
	div.style.top = y + "px";
	return div;
}

function createVerticalLink(container, x, y, height, pool, match, idx) {
	let div = document.createElement("div");
	container.appendChild(div);
	div.classList.add("link", "vertical");
	div.id = `link-vert-${pool}-${match}-${idx}`;
	div.setAttribute("data-set", false);
	div.setAttribute("data-pool", pool);
	div.setAttribute("data-match", match);
	div.setAttribute("data-idx", idx);
	div.onclick = () => console.log(`link-vert-${pool}-${match}-${idx}  |  x: ${x}  y: ${y}`);
	div.style.left = x + "px";
	div.style.top = y + "px";
	div.style.height = (height + 6) + "px";
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
