/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   GameConfig.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:31:54 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/26 02:36:27 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, persistSuccess, redirect } from "../script.js";
import { postJson } from "../utils.js";
import { Chat } from "../components/Chat.js";
import { Konami } from "../components/Konami.js";


const TCColors = [
	'white', 'black', 'red', 'blue', 'green', 'yellow', 'purple', 'aqua'
]

const TCHexColors = [
	'#fff', '#000', '#f00', '#00f', '#0f0', '#ff0', '#f0f', '#0ff'
]

	const TCShapes = [
		'circle', 'cross', 'triangle', 'square'
	]

const TCGetShape = (val) => val & 0b1111;
const TCGetColor = (val) => (val >> 4) & 0b1111;
const TCGetValue = (shape, color) => (color << 4) | shape;
const TCGetLimit = (val1, val2) => val1 == val2 ? -1 : (val1 << 8) | val2;


async function GameConfig(context, id = null) {
	let div = document.createElement("div");

	div.innerHTML += /*html*/`
		<div id="GameConfig-content">
		<div class="GameConfig-container container-blur">
				<div class="GameConfig-Mode row d-flex justify-content-center">
					<div class="text-center d-flex justify-content-around">
						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn1" autocomplete="off">
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn1">First<br>To</label>

						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn2" autocomplete="off" checked>
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn2">Battle<br>Royal</label>

						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn3" autocomplete="off">
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn3">Time<br>Out</label>

						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn4" autocomplete="off">
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn4">Tic Tac<br>Toe</label>
					</div>
				</div>
				<div class="GameConfig-Line my-4" style="margin-bottom: 15px !important;"></div>
				<div class="row d-flex justify-content-between px-4">
					<div class="col-md-3 my-3">
						<div class="row py-2 d-flex justify-content-center">
							<div class="text-center p-4 fs-3 fw-semibold">${getLang(context, "pages.gameConfig.players")}:</div>
							<div class="kbd-span">
								<span class="pointer notSelectable" decr="player-count">-</span>
								<input type="number" id="player-count" class="fs-5 text-center fw-light" value="2" min="2" max="30">
								<span class="pointer notSelectable" incr="player-count">+</span>
							</div>
						</div>
						<div class="GameConfig-Points row justify-content-center" style="display: none;">
							<div class="text-center p-4 fs-3 fw-semibold">${getLang(context, "pages.gameConfig.pointsToWin")}:</div>
							<div class="kbd-span">
								<span class="pointer notSelectable" decr="limit-ft">-</span>
								<input type="number" id="limit-ft" class="fs-5 fw-light w100" value="5" min="1" max="100">
								<span class="pointer notSelectable" incr="limit-ft">+</span>
							</div>
						</div>
						<div class="GameConfig-Time row justify-content-center" style="display: none;">
							<div class="text-center p-4 fs-3 fw-semibold">${getLang(context, "pages.gameConfig.timer")}:</div>
							<div class="kbd-span">
								<span class="pointer notSelectable" decr="limit-to-sec-dec">-</span>
								<input type="number" id="limit-to-min-dec" class="fs-5 fw-light w09" value="0" min="0" max="9">
								<input type="number" id="limit-to-min-uni" class="fs-5 fw-light w09" value="3" min="0" max="9">
								<span class="default-cursor notSelectable">:</span>
								<input type="number" id="limit-to-sec-dec" class="fs-5 fw-light w09" value="0" min="0" max="9">
								<input type="number" id="limit-to-sec-uni" class="fs-5 fw-light w09" value="0" min="0" max="9">
								<span class="pointer notSelectable" incr="limit-to-sec-dec">+</span>
							</div>
						</div>
					</div>
					<div class="col-md-6 my-5">
						<div class="row d-flex justify-content-center">
							<div class="col-md-6 my-2 GameConfig-Img d-flex justify-content-center">
								<input type="radio" class="btn-check GameConfig-ThemeInput" name="ThemeRadio" id="ThemeRadio1" autocomplete="off" checked>
								<label class="btn GameConfig-ThemeLabel" for="ThemeRadio1"><img src="https://raw.githubusercontent.com/42data/r/main/ft_transcendence/theme0.png"></label>
							</div>
							<div class="col-md-6 my-2 GameConfig-Img d-flex justify-content-center">
								<input type="radio" class="btn-check GameConfig-ThemeInput" name="ThemeRadio" id="ThemeRadio2" autocomplete="off">
								<label class="btn GameConfig-ThemeLabel" for="ThemeRadio2"><img src="https://raw.githubusercontent.com/42data/r/main/ft_transcendence/theme1.png"></label>
							</div>
							<div class="col-md-6 my-2 GameConfig-Img d-flex justify-content-center">
								<input type="radio" class="btn-check GameConfig-ThemeInput" name="ThemeRadio" id="ThemeRadio3" autocomplete="off">
								<label class="btn GameConfig-ThemeLabel" for="ThemeRadio3"><img src="https://raw.githubusercontent.com/42data/r/main/ft_transcendence/theme2.png"></label>
							</div>
							<div class="col-md-6 my-2 GameConfig-Img d-flex justify-content-center">
								<input type="radio" class="btn-check GameConfig-ThemeInput" name="ThemeRadio" id="ThemeRadio4" autocomplete="off">
								<label class="btn GameConfig-ThemeLabel" for="ThemeRadio4"><img src="https://raw.githubusercontent.com/42data/r/main/ft_transcendence/theme3.png"></label>
							</div>
						</div>

						<div class="row d-flex justify-content-center" style="display: none !important;">
							<div class="kbd-span">
								<span class="pointer notSelectable" id="limit-tc-1-shape-decr">&lt;&lt;</span>
								<span class="pointer notSelectable" id="limit-tc-1-color-decr">&lt;</span>
								<span class="default-cursor notSelectable" id="limit-tc-1" value="0">...</span>
								<span class="pointer notSelectable" id="limit-tc-1-color-incr">&gt;</span>
								<span class="pointer notSelectable" id="limit-tc-1-shape-incr">&gt;&gt;</span>
							</div>
							<div style="width: 100%; margin: 10px; text-align: center;">Vs.</div>
							<div class="kbd-span">
								<span class="pointer notSelectable" id="limit-tc-2-shape-decr">&lt;&lt;</span>
								<span class="pointer notSelectable" id="limit-tc-2-color-decr">&lt;</span>
								<span class="default-cursor notSelectable" id="limit-tc-2" value="0">...</span>
								<span class="pointer notSelectable" id="limit-tc-2-color-incr">&gt;</span>
								<span class="pointer notSelectable" id="limit-tc-2-shape-incr">&gt;&gt;</span>
							</div>
						</div>
					</div>
					<div class="col-md-3 my-3 d-flex flex-column justify-content-between">
						<div class="GameConfig-Speed row py-2 d-flex justify-content-center">
							<div class="text-center p-4 fs-3 fw-semibold">${getLang(context, "pages.gameConfig.ballSpeed")}:</div>
							<div class="ball-speed-container">
								<div class="moving-point" id="speed-ball"></div>
								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn1" autocomplete="off">
								<label class="btn GameConfig-SpeedLabel" for="SpeedRadio-btn1">${getLang(context, "pages.gameConfig.slow")}</label>

								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn2" checked autocomplete="off">
								<label class="btn GameConfig-SpeedLabel" for="SpeedRadio-btn2">${getLang(context, "pages.gameConfig.normal")}</label>

								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn3" autocomplete="off">
								<label class="btn GameConfig-SpeedLabel" for="SpeedRadio-btn3">${getLang(context, "pages.gameConfig.fast")}</label>
							</div>
						</div>
							<div class="row pb-5 pe-5"><div class="d-flex justify-content-end">
							<button type="button" id="start-btn" class="btn GameConfig-Continue btn-outline-info fs-5">${getLang(context, "pages.gameConfig.start")} ➡</button>
						</div></div>
					</div>
				</div>
			</div>
		</div>
	`;
	div.insertBefore(await NavBar(getLang(context, "pages.play.title"), context), div.firstChild);
	div.insertBefore(Persistents(context), div.firstChild);
	div.appendChild(Chat(context));
	div.appendChild(Konami(context));

		let modeFT = div.querySelector("#ModeRadio-btn1");
		let modeBR = div.querySelector("#ModeRadio-btn2");
		let modeTO = div.querySelector("#ModeRadio-btn3");
		let modeTC = div.querySelector("#ModeRadio-btn4");
		let playerCount = div.querySelector("#player-count");
		let limitFT = div.querySelector("#limit-ft");
		let limitTOMinDec = div.querySelector("#limit-to-min-dec");
		let limitTOMinUni = div.querySelector("#limit-to-min-uni");
		let limitTOSecDec = div.querySelector("#limit-to-sec-dec");
		let limitTOSecUni = div.querySelector("#limit-to-sec-uni");
		let limitTC1 = div.querySelector("#limit-tc-1");
		let limitTC2 = div.querySelector("#limit-tc-2");
		let limitTC1Shape = div.querySelector("#limit-tc-1-shape");
		let limitTC1Color = div.querySelector("#limit-tc-1-color");
		let limitTC2Shape = div.querySelector("#limit-tc-2-shape");
		let limitTC2Color = div.querySelector("#limit-tc-2-color");
		let limitTC1ShapeIncr = div.querySelector("#limit-tc-1-shape-incr");
		let limitTC1ColorIncr = div.querySelector("#limit-tc-1-color-incr");
		let limitTC1ShapeDecr = div.querySelector("#limit-tc-1-shape-decr");
		let limitTC1ColorDecr = div.querySelector("#limit-tc-1-color-decr");
		let limitTC2ShapeIncr = div.querySelector("#limit-tc-2-shape-incr");
		let limitTC2ColorIncr = div.querySelector("#limit-tc-2-color-incr");
		let limitTC2ShapeDecr = div.querySelector("#limit-tc-2-shape-decr");
		let limitTC2ColorDecr = div.querySelector("#limit-tc-2-color-decr");
		let theme1 = div.querySelector("#ThemeRadio1");
		let theme2 = div.querySelector("#ThemeRadio2");
		let theme3 = div.querySelector("#ThemeRadio3");
		let theme4 = div.querySelector("#ThemeRadio4");
		let speedBall = div.querySelector("#speed-ball");
		let speed1 = div.querySelector("#SpeedRadio-btn1");
		let speed2 = div.querySelector("#SpeedRadio-btn2");
		let speed3 = div.querySelector("#SpeedRadio-btn3");
		let startBtn = div.querySelector("#start-btn");

		div.querySelectorAll("[decr]").forEach(e => e.onclick = () => {
			let input = div.querySelector(`#${e.getAttribute("decr")}`);
			input.value = parseInt(input.value) - 1;
			normalizeTime(limitTOMinDec, limitTOMinUni, limitTOSecDec, limitTOSecUni);
			normalizeOther(playerCount);
			normalizeOther(limitFT);
		});
		div.querySelectorAll("[incr]").forEach(e => e.onclick = () => {
			let input = div.querySelector("#" + e.getAttribute("incr"));
			input.value = parseInt(input.value) + 1;
			normalizeTime(limitTOMinDec, limitTOMinUni, limitTOSecDec, limitTOSecUni);
			normalizeOther(playerCount);
			normalizeOther(limitFT);
		});
		div.querySelectorAll("input[type=number]").forEach(e => {
			e.addEventListener("focus", (e) => e.target.select());
			e.addEventListener("wheel", event => {
				let input = event.target;
				input.value = parseInt(input.value) + (event.deltaY < 0 ? 1 : -1);
				normalizeTime(limitTOMinDec, limitTOMinUni, limitTOSecDec, limitTOSecUni);
				normalizeOther(playerCount);
				normalizeOther(limitFT);
			}, {passive: true});
		});

		limitTOMinDec.addEventListener("input", (e) =>
			inputTime(e.target, limitTOMinUni, limitTOMinDec, limitTOMinUni, limitTOSecDec, limitTOSecUni));
		limitTOMinUni.addEventListener("input", (e) =>
			inputTime(e.target, limitTOSecDec, limitTOMinDec, limitTOMinUni, limitTOSecDec, limitTOSecUni));
		limitTOSecDec.addEventListener("input", (e) =>
			inputTime(e.target, limitTOSecUni, limitTOMinDec, limitTOMinUni, limitTOSecDec, limitTOSecUni));
		limitTOSecUni.addEventListener("input", (e) =>
			inputTime(e.target, null, limitTOMinDec, limitTOMinUni, limitTOSecDec, limitTOSecUni));

		limitTC1ShapeIncr.addEventListener("click", (e) =>
			changeTC(limitTC1, limitTC1Shape, limitTC1Color, 1, 0));
		limitTC1ColorIncr.addEventListener("click", (e) =>
			changeTC(limitTC1, limitTC1Shape, limitTC1Color, 0, 1));
		limitTC1ShapeDecr.addEventListener("click", (e) =>
			changeTC(limitTC1, limitTC1Shape, limitTC1Color, -1, 0));
		limitTC1ColorDecr.addEventListener("click", (e) =>
			changeTC(limitTC1, limitTC1Shape, limitTC1Color, 0, -1));
		limitTC2ShapeIncr.addEventListener("click", (e) =>
			changeTC(limitTC2, limitTC2Shape, limitTC2Color, 1, 0));
		limitTC2ColorIncr.addEventListener("click", (e) =>
			changeTC(limitTC2, limitTC2Shape, limitTC2Color, 0, 1));
		limitTC2ShapeDecr.addEventListener("click", (e) =>
			changeTC(limitTC2, limitTC2Shape, limitTC2Color, -1, 0));
		limitTC2ColorDecr.addEventListener("click", (e) =>
			changeTC(limitTC2, limitTC2Shape, limitTC2Color, 0, -1));

		// Default values
		changeTC(limitTC1, limitTC1Shape, limitTC1Color, 0, 2);
		changeTC(limitTC2, limitTC2Shape, limitTC2Color, 1, 3);

		playerCount.addEventListener("change", () => changeOther(playerCount));
		limitFT.addEventListener("change", () => changeOther(limitFT));

		modeFT.addEventListener("change", () => {
			playerCount.parentElement.parentElement.style.display = "flex";
			limitFT.parentElement.parentElement.style.display = "flex";
			limitTOSecUni.parentElement.parentElement.style.display = "none";
			theme1.parentElement.parentElement.style.display = "flex";
			speedBall.parentElement.parentElement.style.display = "flex";
			limitTC1.parentElement.parentElement.style.setProperty("display", "none", "important");
		});
		modeBR.addEventListener("change", () => {
			playerCount.parentElement.parentElement.style.display = "flex";
			limitFT.parentElement.parentElement.style.display = "none";
			limitTOSecUni.parentElement.parentElement.style.display = "none";
			theme1.parentElement.parentElement.style.display = "flex";
			speedBall.parentElement.parentElement.style.display = "flex";
			limitTC1.parentElement.parentElement.style.setProperty("display", "none", "important");
		});
		modeTO.addEventListener("change", () => {
			playerCount.parentElement.parentElement.style.display = "flex";
			limitFT.parentElement.parentElement.style.display = "none";
			limitTOSecUni.parentElement.parentElement.style.display = "flex";
			theme1.parentElement.parentElement.style.display = "flex";
			speedBall.parentElement.parentElement.style.display = "flex";
			limitTC1.parentElement.parentElement.style.setProperty("display", "none", "important");
		});
		modeTC.addEventListener("change", () => {
			limitFT.parentElement.parentElement.style.display = "none";
			limitTOSecUni.parentElement.parentElement.style.display = "none";
			playerCount.parentElement.parentElement.style.setProperty("display", "none", "important");
			theme1.parentElement.parentElement.style.setProperty("display", "none", "important");
			speedBall.parentElement.parentElement.style.setProperty("display", "none", "important");
			limitTC1.parentElement.parentElement.style.setProperty("display", "flex", "important");
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
			let playerCountVal = modeTC.checked ? 2 : parseInt(playerCount.value);
			let limitFTVal = parseInt(limitFT.value);
			let limitTOVal = normalizeTime(limitTOMinDec, limitTOMinUni, limitTOSecDec, limitTOSecUni);
			if (modeFT.checked + modeBR.checked + modeTO.checked + modeTC.checked !== 1)
				return err(getLang(context, "errors.selectGameMode"));
			if (isNaN(playerCountVal) || playerCountVal < 2 || playerCountVal > 30)
				return err(getLang(context, "errors.selectPlayers", 2, 30));
			if (modeFT.checked && (isNaN(limitFTVal) || limitFTVal < 1 || limitFTVal > 100))
				return err(getLang(context, "errors.selectPoints", 1, 100));
			if (theme1.checked + theme2.checked + theme3.checked + theme4.checked !== 1)
				return err(getLang(context, "errors.selectTheme"));
			if (speed1.checked + speed2.checked + speed3.checked !== 1)
				return err(getLang(context, "errors.selectBallSpeed"));

			changeTC(limitTC1, limitTC1Shape, limitTC1Color, 0, 0);
			changeTC(limitTC2, limitTC2Shape, limitTC2Color, 0, 0);
			let limitTCVal = TCGetLimit(parseInt(limitTC1.getAttribute('value')), parseInt(limitTC2.getAttribute('value')));
			if (limitTCVal == -1)
				return;

			let post = {
				mode: modeFT.checked ? "FT" : modeTO.checked ? "TO" : modeTC.checked ? "TC" : "BR",
				players: modeTC.checked ? 2 : playerCountVal,
				theme: theme1.checked ? 0 : theme2.checked ? 1 : theme3.checked ? 2 : 3,
				speed: speed1.checked ? 0 : speed2.checked ? 1 : 2,

				limitFT: modeFT.checked ? limitFTVal : undefined,
				limitTO: modeTO.checked ? limitTOVal : undefined,
				limitTC: modeTC.checked ? limitTCVal : undefined,
			};
			postJson(context, "/api/game/new", post).then(data => {
				if (data.ok) {
					persistSuccess(context, getLang(context, data.success));
					redirect(`/play/${data.uid}`);
				} else {
					persistError(context,getLang(context, data.error));
					pushPersistents(context);
				}
			});
		});
	return div;
}

function normalizeTime(minDec, minUni, secDec, secUni, minTime = 60, maxTime = 3600) {
	let minDecVal = parseInt(minDec.value);
	let minUniVal = parseInt(minUni.value);
	let secDecVal = parseInt(secDec.value);
	let secUniVal = parseInt(secUni.value);

	if (isNaN(minDecVal))
		minDecVal = 0;
	if (isNaN(minUniVal))
		minUniVal = 0;
	if (isNaN(secDecVal))
		secDecVal = 0;
	if (isNaN(secUniVal))
		secUniVal = 0;

	let time = secUniVal + secDecVal * 10 + minUniVal * 60 + minDecVal * 600;
	console.log(time, minDecVal, minUniVal, secDecVal, secUniVal);
	if (time < minTime)
		time = minTime;
	if (time > maxTime)
		time = maxTime;

	let timeOld = time;

	minDec.value = Math.floor(time / 600);
	time -= minDec.value * 600;
	minUni.value = Math.floor(time / 60);
	time -= minUni.value * 60;
	secDec.value = Math.floor(time / 10);
	time -= secDec.value * 10;
	secUni.value = time;

	return timeOld;
}

function inputTime(current, next, minDec, minUni, secDec, secUni) {
	if (current.value.length == 0)
		return;
	let val = parseInt(current.value);
	if (isNaN(val)) {
		current.value = "";
		return;
	}
	normalizeTime(minDec, minUni, secDec, secUni);
	if (next)
		next.focus();
	else
		current.blur();
}

function changeOther(current) {
	if (current.value.length == 0)
		return;
	let val = parseInt(current.value);
	if (isNaN(val)) {
		current.value = "";
		return;
	}
	normalizeOther(current);
	current.blur();
}

function normalizeOther(current) {
	let val = parseInt(current.value);
	let min = parseInt(current.min);
	let max = parseInt(current.max);
	if (isNaN(val))
		val = min;
	if (val < min)
		val = min;
	if (val > max)
		val = max;
	current.value = val;
}

function changeTC(current, shape, color, shapeInc, colorInc) {
	let val = parseInt(current.getAttribute('value'));
	if (isNaN(val))
		val = 0;

	let shapeVal = TCGetShape(val);
	let colorVal = TCGetColor(val);

	shapeVal += shapeInc;
	if (shapeVal < 0)
		shapeVal = TCShapes.length - 1;
	if (shapeVal >= TCShapes.length)
		shapeVal = 0;

	colorVal += colorInc;
	if (colorVal < 0)
		colorVal = TCColors.length - 1;
	if (colorVal >= TCColors.length)
		colorVal = 0;

	current.setAttribute('value', TCGetValue(shapeVal, colorVal));

	current.innerText = TCShapes[shapeVal];
	current.style.color = TCHexColors[colorVal];
}


export { GameConfig };
