/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   GameConfig.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:31:54 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/27 22:56:57 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { persistError, persistSuccess, redirect } from "../script.js";
import { postJson } from "../utils.js";


async function GameConfig(context, id = null) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Game Settings", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<div id="GameConfig-content">
		<div class="GameConfig-container container-blur">
				<div class="GameConfig-Mode row d-flex justify-content-center">
					<div class="col-md-5 text-center d-flex justify-content-around">
						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn1" autocomplete="off">
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn1">First To</label>

						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn2" autocomplete="off" checked>
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn2">Battle Royal</label>

						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn3" autocomplete="off">
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn3">Time Out</label>
					</div>
				</div>
				<div class="GameConfig-Line my-4" style="margin-bottom: 15px !important;"></div>
				<div class="row d-flex justify-content-center">
					<div class="col-md-3 my-3">
						<div class="row py-2 d-flex justify-content-center">
							<div class="text-center p-4 fs-3 fw-semibold">Players :</div>
							<input type="number" id="player-count" class="form-control fs-4 text-center fw-light" value="2" min="2" max="100">
						</div>
						<div class="GameConfig-Points row justify-content-center" style="display: none;">
								<div class="text-center p-4 fs-3 fw-semibold">Points to Win :</div>
								<input type="number" id="limit-ft" class="form-control fs-4 text-center fw-light" value="5" min="1" max="30">
						</div>
						<div class="GameConfig-Time row justify-content-center" style="display: none;">
								<div class="text-center p-4 fs-3 fw-semibold">Timer (min) :</div>
								<input type="number" id="limit-to" class="form-control fs-4 text-center fw-light" value="3" min="1" max="60">
						</div>
					</div>
					<div class="col-md-5 my-5">
						<div class="row d-flex justify-content-center">
							<div class="col-md-6 my-2 GameConfig-Img d-flex justify-content-center">
								<input type="radio" class="btn-check GameConfig-ThemeInput" name="ThemeRadio" id="ThemeRadio1" autocomplete="off" checked>
								<label class="btn GameConfig-ThemeLabel" for="ThemeRadio1"><img src="/static/img/Theme.png"></label>
							</div>
							<div class="col-md-6 my-2 GameConfig-Img d-flex justify-content-center">
								<input type="radio" class="btn-check GameConfig-ThemeInput" name="ThemeRadio" id="ThemeRadio2" autocomplete="off">
								<label class="btn GameConfig-ThemeLabel" for="ThemeRadio2"><img src="/static/img/Theme.png"></label>
							</div>
							<div class="col-md-6 my-2 GameConfig-Img d-flex justify-content-center">
								<input type="radio" class="btn-check GameConfig-ThemeInput" name="ThemeRadio" id="ThemeRadio3" autocomplete="off">
								<label class="btn GameConfig-ThemeLabel" for="ThemeRadio3"><img src="/static/img/Theme.png"></label>
							</div>
							<div class="col-md-6 my-2 GameConfig-Img d-flex justify-content-center">
								<input type="radio" class="btn-check GameConfig-ThemeInput" name="ThemeRadio" id="ThemeRadio4" autocomplete="off">
								<label class="btn GameConfig-ThemeLabel" for="ThemeRadio4"><img src="/static/img/Theme.png"></label>
							</div>
						</div>
					</div>
					<div class="col-md-3 my-3 d-flex flex-column justify-content-between">
						<div class="GameConfig-Speed row py-2 d-flex justify-content-center">
							<div class="text-center p-4 fs-3 fw-semibold">Ball Speed :</div>
							<div class="container-blur d-flex justify-content-around py-2">
								<div class="moving-point" id="speed-ball"></div>
								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn1" autocomplete="off">
								<label class="btn GameConfig-SpeedLabel" for="SpeedRadio-btn1">Slow</label>

								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn2" checked autocomplete="off">
								<label class="btn GameConfig-SpeedLabel mx-3" for="SpeedRadio-btn2">Normal</label>

								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn3" autocomplete="off">
								<label class="btn GameConfig-SpeedLabel" for="SpeedRadio-btn3">Fast</label>
							</div>
						</div>
							<div class="row pb-5 pe-5"><div class="d-flex justify-content-end">
							<button type="button" id="start-btn" class="btn GameConfig-Continue btn-outline-info fs-5">Start ➡</button>
						</div></div>
					</div>
				</div>
			</div>
		</div>
	`;
	setTimeout(() => {
		let modeFT = document.getElementById("ModeRadio-btn1");
		let modeBR = document.getElementById("ModeRadio-btn2");
		let modeTO = document.getElementById("ModeRadio-btn3");
		let playerCount = document.getElementById("player-count");
		let limitFT = document.getElementById("limit-ft");
		let limitTO = document.getElementById("limit-to");
		let theme1 = document.getElementById("ThemeRadio1");
		let theme2 = document.getElementById("ThemeRadio2");
		let theme3 = document.getElementById("ThemeRadio3");
		let theme4 = document.getElementById("ThemeRadio4");
		let speedBall = document.getElementById("speed-ball");
		let speed1 = document.getElementById("SpeedRadio-btn1");
		let speed2 = document.getElementById("SpeedRadio-btn2");
		let speed3 = document.getElementById("SpeedRadio-btn3");
		let startBtn = document.getElementById("start-btn");

		modeFT.addEventListener("change", () => {
			limitFT.parentElement.style.display = "flex";
			limitTO.parentElement.style.display = "none";
		});
		modeBR.addEventListener("change", () => {
			limitFT.parentElement.style.display = "none";
			limitTO.parentElement.style.display = "none";
		});
		modeTO.addEventListener("change", () => {
			limitFT.parentElement.style.display = "none";
			limitTO.parentElement.style.display = "flex";
		});
		function updateSpeed(speed) {
			let interval = setInterval(() => {
				let f = parseFloat(speedBall.style.opacity);
				if (isNaN(f))
					f = 1;
				if (f <= 0) {
					speedBall.style.animation = "none";
					speedBall.offsetHeight; // trigger reflow
					speedBall.style.animation = null;
					speedBall.style.animationDuration = speed;
					let interval2 = setInterval(() => {
						let f = parseFloat(speedBall.style.opacity);
						if (f >= 1) {
							speedBall.style.opacity = "1";
							clearInterval(interval2);
						}
						speedBall.style.opacity = `${f + 0.015}`;
					}, 1);
					clearInterval(interval);
				}
				speedBall.style.opacity = `${f - 0.015}`;
			}, 1);

		}
		speed1.addEventListener("change", () => updateSpeed("15s"));
		speed2.addEventListener("change", () => updateSpeed("5s"));
		speed3.addEventListener("change", () => updateSpeed("2s"));

		function err(mess) {
			persistError(context, mess);
			pushPersistents(context);
		}
		startBtn.addEventListener("click", () => {
			let playerCountVal = parseInt(playerCount.value);
			let limitFTVal = parseInt(limitFT.value);
			let limitTOVal = parseInt(limitTO.value);
			if (modeFT.checked + modeBR.checked + modeTO.checked !== 1)
				return err("Please select a game mode."); // TODO: translate
			if (isNaN(playerCountVal) || playerCountVal < 2 || playerCountVal > 30)
				return err("Please select a number of players between 2 and 50."); // TODO: translate
			if (modeFT.checked && (isNaN(limitFTVal) || limitFTVal < 1 || limitFTVal > 50))
				return err("Please select a number of points between 1 and 30."); // TODO: translate
			if (modeTO.checked && (isNaN(limitTOVal) || limitTOVal < 1 || limitTOVal > 60))
				return err("Please select a timer between 1 and 60 minutes."); // TODO: translate
			if (theme1.checked + theme2.checked + theme3.checked + theme4.checked !== 1)
				return err("Please select a theme."); // TODO: translate
			if (speed1.checked + speed2.checked + speed3.checked !== 1)
				return err("Please select a ball speed."); // TODO: translate

			let post = {
				mode: modeFT.checked ? "FT" : modeTO.checked ? "TO" : "BR",
				players: parseInt(playerCountVal),
				theme: theme1.checked ? 0 : theme2.checked ? 1 : theme3.checked ? 2 : 3,
				speed: speed1.checked ? 0 : speed2.checked ? 1 : 2,

				limitFT: modeFT.checked ? limitFTVal : undefined,
				limitTO: modeTO.checked ? limitTOVal : undefined,
			};
			postJson(context, "/api/game/new", post).then(data => {
				if (data.ok) {
					persistSuccess(context, data.success);
					redirect(`/play/${data.uid}`);
				} else {
					persistError(context, data.error);
					pushPersistents(context);
				}
			});
		});
	}, 250);
	return div.outerHTML;
}


export { GameConfig };
