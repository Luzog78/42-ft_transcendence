import { Home } from "./pages/Home.js";
import { Login } from "./pages/Login.js";
import { Logout } from "./pages/Logout.js";
import { Register } from "./pages/Register.js";
import { Err404 } from "./pages/Err404.js";
import { CompleteProfileSample, Profile } from "./pages/Profile.js";
import { Play } from "./pages/Play.js";

var global_context = {
	user: {
		username: null,
		email: null,
		is_authenticated: false,
	},
	persistant: [],
	next: null,
};

/**
 * @note	Path arguments:
 * @note	- <numbers>		: Any number
 * @note	- <letters>		: Any letter
 * @note	- <alphanum>	: Any alphanumeric character
 * @note	- <any>			: Any character
 */
const router = [
	{
		path: undefined,
		component: Err404,
	},
	{
		path: "/",
		component: Home,
	},
	{
		path: "/login",
		component: Login,
	},
	{
		path: "/logout",
		component: Logout,
	},
	{
		path: "/register",
		component: Register,
	},
	{
		path: "/profile",
		component: Profile,
	},
	{
		path: "/profile/sample",
		component: CompleteProfileSample,
	},
	{
		path: "/profile/<numbers>",
		component: Profile,
	},
	{
		path: "/play",
		component: Play,
	},
];

const content = document.getElementById("body-content");

const loadPage = (path) => {
	let next = new URLSearchParams(window.location.search).get("next");
	if (next)
		global_context.next = next;
	
	let route = null;
	let args = [];
	let pathes = path.split("/");
	for (let i = 1; i < router.length; i++) {
		let rPathes = router[i].path.split("/");
		let ok = rPathes.length === pathes.length;
		for (let j = 0; ok && j < rPathes.length; j++) {
			if (rPathes[j] === "<numbers>")
				if (isNaN(pathes[j]))
					ok = false;
				else
					args.push(parseInt(pathes[j]));
			else if (rPathes[j] === "<letters>")
				if (!/^[a-zA-Z]+$/.test(pathes[j]))
					ok = false;
				else
					args.push(pathes[j]);
			else if (rPathes[j] === "<alphanum>")
				if (!/^[a-zA-Z0-9]+$/.test(pathes[j]))
					ok = false;
				else
					args.push(pathes[j]);
			else if (rPathes[j] === "<any>")
				args.push(pathes[j]);
			else if (rPathes[j] !== pathes[j])
				ok = false;
		}
		if (ok) {
			route = router[i];
			break;
		}
		args = [];
	}
	if (!route)
		route = router[0];
	let inner = route.component(global_context, ...args);
	if (inner === null || inner === undefined || inner === "")
		return;
	content.innerHTML = inner;
}

const redirect = (path) => {
	let href = window.location.origin + path;
	window.history.pushState(null, null, href);
	loadPage(path.split("?")[0].split("#")[0]);
}

const refresh = () => {
	loadPage(window.location.pathname);
}

const popNext = (context) => {
	if (!context.next)
		return null;
	context.next = context.next.split(";");
	while (context.next.length) {
		if (context.next[0] === "")
			context.next.shift();
		else {
			let nextPath = context.next.shift();
			if (context.next.length)
				nextPath += "?next=" + context.next.join(";");
			context.next = null;
			return nextPath;
		}
	}
	context.next = null;
	return null;
}

const persistSuccess = (context, message) => {
	context.persistant.push({ ok: true, message: message });
}

const persistError = (context, message) => {
	context.persistant.push({ ok: false, message: message });
}

window.addEventListener("load", () => {
	if (window.location.pathname !== "/" && window.location.pathname.endsWith("/"))
		window.history.pushState(null, null, window.location.pathname.slice(0, -1)
			+ window.location.search + window.location.hash);

	document.body.addEventListener("click", (e) => {
		if (e.target.matches("[data-link]")) {
			e.preventDefault();
			window.history.pushState(null, null, e.target.href);
			loadPage(new URL(e.target.href).pathname);
		}
	});

	// onLocationChange (using back/forward buttons)
	window.addEventListener("popstate", () => {
		loadPage(window.location.pathname);
	});

	loadPage(window.location.pathname);
});

export { redirect, refresh, popNext, persistSuccess, persistError };

console.log("[✅] Scripts loaded successfully!");
