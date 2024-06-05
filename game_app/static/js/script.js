import { Home } from "./pages/Home.js";
import { Login } from "./pages/Login.js";
import { Logout } from "./pages/Logout.js";
import { Register } from "./pages/Register.js";
import { Err404 } from "./pages/Err404.js";

var global_context = {
	user: {
		username: null,
		email: null,
		is_authenticated: false,
	},
	persistant: {
		success: [],
		error: [],
	},
	next: null,
};

const router = [
	{
		path: undefined,
		component: Err404,
		context: {},
	},
	{
		path: "/",
		component: Home,
		context: {},
	},
	{
		path: "/login",
		component: Login,
		context: {},
	},
	{
		path: "/logout",
		component: Logout,
		context: {},
	},
	{
		path: "/register",
		component: Register,
		context: {},
	},
];

const content = document.getElementById("body-content");

const loadPage = (path) => {
	let next = new URLSearchParams(window.location.search).get("next");
	if (next)
		global_context.next = next;

	let route = router.find(r => r.path === path);
	if (!route)
		route = router[0];
	content.innerHTML = route.component(global_context);
}

const redirect = (path) => {
	let href = window.location.origin + path;
	window.history.pushState(null, null, href);
	loadPage(path);
}

const refresh = () => {
	loadPage(window.location.pathname);
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

export { redirect, refresh };

console.log("[✅] Scripts loaded successfully!");
