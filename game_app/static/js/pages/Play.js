import { NavBar } from "../components/NavBar.js";
import { Persistants } from "../components/Persistants.js";
import { checkUID, clearFeedbacks, postJson } from "../utils.js";

function Play(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Play", context);
	div.innerHTML += Persistants(context);
	div.innerHTML += /*html*/`
		<div class="container container-blur form-ssm" style="padding: 50px; margin-top: 100px;">
			<form class="row g-3" id="play-form" style="margin-top: 0px;">
				<div class="row col-12">
					<div class="col-8" style="padding-right: 2px;">
						<input type="text" class="form-control" id="uid" placeholder="Join an existing game...">
					</div>
					<div class="col-4" style="padding-left: 2px;">
						<button id="join-button" class="btn btn-success" type="submit">JOIN</button>
					</div>
				</div>
				
				<hr>

				<div class="row col-12">
					<div class="col-12">
						<button id="play-button" class="btn btn-success" type="submit">PLAY</span>
					</div>
				</div>
			</form>
		</div>
	`;
	setTimeout(() => {
		let form = document.querySelector("#play-form");
		if (form === null)
			return;
		form.onsubmit = (event) => event.preventDefault();
		document.querySelector("#join-button").onclick = () => {
			clearFeedbacks(form);
			if (!checkUID("#uid"))
				return;
			console.log("Joining game...");
		};
		document.querySelector("#play-button").onclick = () => {
			console.log("Playing game...");
		};
	}, 250);
	return div.outerHTML;
}

export { Play };
