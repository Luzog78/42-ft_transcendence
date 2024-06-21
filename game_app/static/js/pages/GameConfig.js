/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   GameConfig.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:31:54 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/21 02:32:05 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";

function GameConfig(context, id) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Game Settings", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<div id="GameConfig-content">
			<div class="text-center fs-2 fw-bolder">#1234</div>
			<div class="GameConfig-container container-blur">
				<div class="GameConfig-Mode row d-flex justify-content-center">
					<div class="col-md-5 text-center d-flex justify-content-around">
						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn1" autocomplete="off" onclick="changeGameOptionPanel('points')">
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn1">First To</label>
						
						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn2" autocomplete="off" checked onclick="changeGameOptionPanel('none')">
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn2">Battle Royal</label>
						
						<input type="radio" class="btn-check GameConfig-ModeInput" name="ModeRadio" id="ModeRadio-btn3" autocomplete="off" onclick="changeGameOptionPanel('time')">
						<label class="btn fs-3 GameConfig-ModeLabel" for="ModeRadio-btn3">Time up</label>
					</div>
				</div>
				<div class="GameConfig-Line my-5"></div>
				<div class="row d-flex justify-content-center">
					<div class="col-md-3 my-3">
						<div class="row py-2 d-flex justify-content-center">
							<div class="text-center p-4 fs-3 fw-semibold">Players :</div>
							<input type="number" class="form-control fs-4 text-center fw-light" value="2" min="2" max="100">
						</div>
						<div class="row py-2" id="GameConfig-Panel">
							<div class="GameConfig-Points">
								<div class="text-center pt-3">Points to Win</div>									
								<input type="number" class="form-control" value="5">
							</div>
							<div class="GameConfig-Time">
								<div class="text-center pt-3">Timer</div>									
								<input type="time" class="form-control" value="03:00">
							</div>
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
								<div class="moving-point"></div>
								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn1" autocomplete="off">
								<label class="btn GameConfig-SpeedLabel" for="SpeedRadio-btn1">Slow</label>
							
								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn2" checked autocomplete="off">
								<label class="btn GameConfig-SpeedLabel mx-3" for="SpeedRadio-btn2">Normal</label>
							
								<input type="radio" class="btn-check GameConfig-SpeedInput" name="SpeedRadio" id="SpeedRadio-btn3" autocomplete="off">
								<label class="btn GameConfig-SpeedLabel" for="SpeedRadio-btn3">Fast</label>
							</div>
						</div>
							<div class="row pb-5 pe-5"><div class="d-flex justify-content-end">
							<button type="button" class="btn GameConfig-Continue btn-outline-info fs-5">Start ➡</button>
						</div></div>
					</div>
				</div>
			</div>
		</div>
	`;
	return div.outerHTML;
}

function changeGameOptionPanel(panel) {
	getComputedStyle(document.getElementById('GameConfig-Panel')).setProperty('--points', 'none');
	getComputedStyle(document.getElementById('GameConfig-Panel')).setProperty('--time', 'none');
	switch (panel) {
		case 'points':
			getComputedStyle(document.getElementById('GameConfig-Panel')).setProperty('--points', 'block');
			break ;
		case 'time':
			getComputedStyle(document.getElementById('GameConfig-Panel')).setProperty('--time', 'block');
			break ;
	}
}

export { GameConfig };
