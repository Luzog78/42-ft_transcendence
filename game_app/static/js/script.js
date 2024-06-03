import { Home } from "./Home.js";
import { Login } from "./Login.js";
import { Logout } from "./Logout.js";
import { Register } from "./Register.js";
import { Err404 } from "./Err404.js";

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

const content = document.getElementById("content");

const loadPage = (path) => {
	let route = router.find(r => r.path === path);
	if (!route)
		route = router[0];
	content.innerHTML = route.component(route.context);
}

window.addEventListener("load", () => {
	if (window.location.pathname !== "/" && window.location.pathname.endsWith("/")) {
		window.history.pushState(null, null, window.location.pathname.slice(0, -1)
			+ window.location.search + window.location.hash);
		window.location.reload();
	}

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

console.log("[✅] Scripts loaded successfully!");
