import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";

function Pong(context)
{
	console.log(context)
	let div = document.createElement("div");
	div.innerHTML = NavBar("Profile", context);
	div.innerHTML += Persistents(context);
	

	let script = document.createElement("script");

	script.type = "module"
	script.src = "static/js/pong_game/main.js";

	document.body.appendChild(script);

	return div.outerHTML;
}

export { Pong }