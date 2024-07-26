/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   LocalGame.js                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/25 23:30:55 by psalame           #+#    #+#             */
/*   Updated: 2024/07/26 03:13:39 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { Chat } from "../components/Chat.js"
import { getLang } from "../script.js";

var inGame = false;

function refreshPositions(ball, ballData, barList, barPositions) {
	ball.style.left = ballData.position[0] + "px";
	ball.style.top = ballData.position[1] + "px";
	barList[0].style.top = barPositions[0] + "px";
	barList[1].style.top = barPositions[1] + "px";
}

function resetGame(container, ball, ballData, barList, barPositions, keyboard) {
	inGame = false;
	ballData.direction[0] = 1;
	ballData.direction[1] = 0;
	ballData.position[0] = container.offsetWidth / 2;
	ballData.position[1] = container.offsetHeight / 2;
	barPositions[0] = container.offsetHeight / 2 - barList[0].offsetHeight / 2;
	barPositions[1] = container.offsetHeight / 2 - barList[1].offsetHeight / 2;
	refreshPositions(ball, ballData, barList, barPositions);
	keyboard.clear();
}

function startGame(container, ball, ballData, barList, barPositions, keyboard) {
	inGame = true;
	const barSpeed = 10 / 924 * window.innerHeight;
	const baseBallSpeed = 2 / 924 * window.innerHeight;
	var interval;
	var ballSpeed = baseBallSpeed * 3;

	interval = setInterval(() => {
		if (!inGame || !document.body.contains(container)) {
			clearInterval(interval);
			resetGame(container, ball, ballData, barList, barPositions, keyboard);
			return;
		}
		if (keyboard.has("w"))
			barPositions[0] = Math.max(barPositions[0] - barSpeed, 0);
		if (keyboard.has("s"))
			barPositions[0] = Math.min(barPositions[0] + barSpeed, container.offsetHeight - barList[0].offsetHeight);
		if (keyboard.has("ArrowUp"))
			barPositions[1] = Math.max(barPositions[1] - barSpeed, 0);
		if (keyboard.has("ArrowDown"))
			barPositions[1] = Math.min(barPositions[1] + barSpeed, container.offsetHeight - barList[1].offsetHeight);

		ballData.position[0] += ballData.direction[0] * ballSpeed;
		ballData.position[1] += ballData.direction[1] * ballSpeed;
		refreshPositions(ball, ballData, barList, barPositions);
		if (!ball.dataset.rot)
			ball.dataset.rot = 0;
		while (ball.dataset.rot < 0)
			ball.dataset.rot = parseInt(ball.dataset.rot) + 360;
		ball.dataset.rot = (parseInt(ball.dataset.rot) + ballData.direction[0] * ballSpeed) % 360;
		ball.style.transform = `rotate(${ball.dataset.rot}deg)`;

		if (ballData.direction[1] < 0 && ballData.position[1] <= 0)
			ballData.direction[1] = -ballData.direction[1];
		if (ballData.direction[1] > 0 && ballData.position[1] + ball.offsetHeight >= container.offsetHeight)
			ballData.direction[1] = -ballData.direction[1];

		if (ballData.direction[0] == -1)
		{
			if (ballData.position[0] <= barList[0].offsetWidth
				&& ballData.position[1] <= barPositions[0] + barList[0].offsetHeight
				&& ballData.position[1] + ball.offsetHeight >= barPositions[0])
			{
				ballData.direction[0] = 1;
				ballData.direction[1] = (Math.random() * 2) - 1;
				ballSpeed += baseBallSpeed;
			}
			else if (ballData.position[0] <= 0) {
				inGame = false;
				let scoreElem = container.querySelector("span");
				let score = scoreElem.textContent.split(" - ");
				score[1]++;
				scoreElem.textContent = score.join(" - ");
			}
		}
		else
		{
			if (ballData.position[0] + ball.offsetWidth >= container.offsetWidth - barList[1].offsetWidth
				&& ballData.position[1] <= barPositions[1] + barList[1].offsetHeight
				&& ballData.position[1] + ball.offsetHeight >= barPositions[1])
				{
					ballData.direction[0] = -1;
					ballData.direction[1] = (Math.random() * 2) - 1;
					ballSpeed += baseBallSpeed;
				}
			else if (ballData.position[0] + ball.offsetWidth >= container.offsetWidth) {
				inGame = false;
				let scoreElem = container.querySelector("span");
				let score = scoreElem.textContent.split(" - ");
				score[0]++;
				scoreElem.textContent = score.join(" - ");
			}
		}
	}, 1/30*1000);
}

async function LocalGame(context) {
	let div = document.createElement("div");
	div.innerHTML += /*html*/`
		<div id="localgame" tabindex="1">
			<div class="bar"></div>
			<div class="bar"></div>
			<div class="ball"></div>
			<span>0 - 0</span>
		</div>
	`;
	div.insertBefore(await NavBar(getLang(context, "pages.home.title"), context), div.firstChild);
	div.appendChild(Persistents(context));
	div.appendChild(Chat(context));

	var container = div.querySelector("#localgame");
	var ball = div.querySelector(".ball");
	let ballImgs = [
		"https://cdn.intra.42.fr/users/0850b4bd9f3ceedc934b34897841fd5c/ycontre.jpg",
		"https://cdn.intra.42.fr/users/1e1b56d76ccf0bf150018fcc40be8781/psalame.jpg",
		"https://cdn.intra.42.fr/users/1046eb06e67db02233dde6a9528d95bc/ysabik.jpg"
	]
	ball.style.backgroundImage = `url('${ballImgs[Math.floor(Math.random() * ballImgs.length)]}')`;
	var barList = div.querySelectorAll(".bar");
	var ballData = {
		direction: [1, 0],
		position: [0, 0],
	}
	var barPositions = [0, 0]
	var keyboard = new Set();

	container.addEventListener("keydown", (e) => {
		if (!inGame) {
			if (e.key == "Enter" || e.key == " ") {
				startGame(container, ball, ballData, barList, barPositions, keyboard);
			}
		} else {
			if (!keyboard.has(e.key)) {
				keyboard.add(e.key);
			}
		}
	});
	container.addEventListener("keyup", (e) => {
		if (keyboard.has(e.key))
			keyboard.delete(e.key);
	})

	setTimeout(() => {
		resetGame(container, ball, ballData, barList, barPositions, keyboard);
		container.focus();
	}, 200);


	return div;
}

export { LocalGame };