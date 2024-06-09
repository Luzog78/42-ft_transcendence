import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";

function Pong(context)
{
	let div = document.createElement("div");
	div.innerHTML = NavBar("Profile", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<style>
			* {
				margin: 0;
			}
		</style>
		<script type="module" src="static/js/pong_game/main.js"></script>
	`;
	return div.outerHTML;
}

export { Pong }