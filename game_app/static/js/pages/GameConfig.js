import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { checkUID, clearFeedbacks } from "../utils.js";

function GameConfig(context, id) {
    let div = document.createElement("div");
    div.innerHTML = NavBar("Game Settings", context);
    div.innerHTML += Persistents(context);
    div.innerHTML += /*html*/`
		<div id=GameConfig-content>
			<div class="text-center fs-2 fw-bolder">#1234</div>
			<div class="container-blur row" style="padding: 50px; margin-top: 75px; max-width: 75%;">
				<div class="GameConfig-RadioMode d-flex justify-content-around fs-1">
					<input type="radio" class="btn-check" name="btnradio" id="btnradio1" autocomplete="off">
					<label class="btn-Mode btn col mx-3 fs-5" for="btnradio1">original 1v1</label>

					<input type="radio" class="btn-check" name="btnradio" id="btnradio2" autocomplete="off">
					<label class="btn-Mode btn col mx-3 fs-3" for="btnradio2">Battleroyal</label>

					<input type="radio" class="btn-check" name="btnradio" id="btnradio3" autocomplete="off">
					<label class="btn-Mode btn col mx-3 fs-5" for="btnradio3">Time 1v1</label>
				</div>
			</div>
		</div>
	`;
    return div.outerHTML;
}

export { GameConfig };
