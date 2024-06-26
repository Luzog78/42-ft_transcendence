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


async function Pong(context, id, data) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Profile", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<style type="text/css">
			canvas {
				position: fixed;
				top: 0;
				z-index: -1;
			}
		</style>
	`;
	if (data && data.waiting) {
		let mode = data.mode === "TO" ? "Time Out"
			: data.mode === "FT" ? "First To"
			: data.mode === "BR" ? "Battle Royale"
			: `??? (${data.mode}) ???`;
		div.innerHTML += /*html*/`
			<div id="playid-content" class="container-fluid container-blur" style="padding: 50px; margin-top: 100px;">
				<div class="moving-point"></div>
				<div class="row">
					<span class="text-center fs-2 GameMode mt-4">${mode}</span>
					<div class="GameConfig-Line my-3"></div>
					<div class="text-center">#${id}</div>
					<div class="text-center search-text fs-1">
						<span
						>S</span><span
						>e</span><span
						>a</span><span
						>r</span><span
						>c</span><span
						>h</span><span
						>i</span><span
						>n</span><span
						>g</span>
					</div>
					<div class="row fs-3 justify-content-center">
						<p class="col-1" id="current-amount">...</p>
						<p class="col-1">/</p>
						<p class="col-1" id="total-amount">...</p>
					</div>
				</div>
			</div>
		`;
	}
	setTimeout(() => initScene(), 200);
	return div.innerHTML;
}

function setCurrentAmount(amount) {
	let elem = document.getElementById("current-amount");
	if (elem)
		elem.innerHTML = amount;
}

function setTotalAmount(amount) {
	let elem = document.getElementById("total-amount");
	if (elem)
		elem.innerHTML = amount;
}

function remWaiting() {
	let elem = document.getElementById("playid-content");
	if (elem)
		elem.remove();
}


export { Pong, setCurrentAmount, setTotalAmount, remWaiting };
