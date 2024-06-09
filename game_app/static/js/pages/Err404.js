import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";

function Err404(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Error 404", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<div style="position: fixed; top: 50%; transform: translateY(-50%); width: 100%; margin: auto">
			<div class="container-blur text-center">
				<h1 class="display-1" style="font-weight: 600;">Page not found...</h1>
				<br><br>
				<p>The page you are looking for does not exist.</p>
				<p>Let's go back <a href="/">home</a>.</p>
			</div>
		</div>
	`;
	return div.outerHTML;
}

export { Err404 };
