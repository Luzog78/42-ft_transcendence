/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   script.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:39 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:39 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { overrideNavBar } from "./components/NavBar.js";
import { Home } from "./pages/Home.js";
import { Login } from "./pages/Login.js";
import { Logout } from "./pages/Logout.js";
import { Register } from "./pages/Register.js";
import { Oauth } from "./pages/Oauth.js";
import { Err404 } from "./pages/Err404.js";
import { Profile } from "./pages/Profile.js";
import { Play } from "./pages/Play.js";
import { PlayId } from "./pages/PlayId.js";
import { Pong } from "./pages/Pong.js";
import { GameConfig} from "./pages/GameConfig.js";
import { Settings } from "./pages/Settings.js";

import { ChatConnexion } from "./ChatConnexion.js";

import { getJson } from "./utils.js";
import { destroyScene } from "./pong_game/main.js";
import { TournamentManager } from "./pages/TournamentManager.js";
import { RefreshFriendList } from "./components/Chat.js";


const SUPPORTED_LANGS = [ "en", "fr", "es", "de", "cn", "jp", "ru", "ka", "eg" ];

var global_context = {
	SUPPORTED_LANGS: SUPPORTED_LANGS,
	langIndex: 0,
	lang: {},
	user: {
		isAuthenticated: false,
		token: null,
		username: null,
		createdAt: null,
		email: null,
		firstName: null,
		lastName: null,
		picture: null,
		lang: null,
		a2f: null,
		isAdmin: null,
		lastLogin: null,
		isOauth: null
	},
	persistent: [],
	next: null,
	chat: {
		ChatConnexion: null,
		FriendList: null,
	},
};
global_context.chat.ChatConnexion = new ChatConnexion(global_context);

window.context = global_context;

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
		path: "/oauth_callback",
		component: Oauth,
	},
	{
		path: "/settings",
		component: Settings,
	},
	{
		path: "/profile",
		component: Profile,
	},
	{
		path: "/profile/<any>",
		component: Profile,
	},
	{
		path: "/play",
		component: Play,
	},
	{
		path: "/play/<alphanum>",
		component: PlayId,
	},
	{
		path: "/pong",
		component: Pong,
	},
	{
		path: "/new",
		component: GameConfig,
	},
	{
		path: "/tournament",
		component: TournamentManager,
	},
	{
		path: "/tournament/<alphanum>",
		component: TournamentManager,
	},
	{
		path: "/create",
		component: TournamentManager,
	},
];

const content = document.getElementById("body-content");

const loadComponent = async (component, ...args) => {
	if (component === null || component === undefined)
		return;
	let inner = await component(global_context, ...args);
	if (inner === null || inner === undefined)
		return;
	while (content.firstChild) {
		content.removeChild(content.lastChild);
	}
	content.appendChild(inner);
}

const loadPage = (path, ...additionnalArgs) => {
	console.log(`[🔀] Loading page: ${path}`, ...additionnalArgs);
	destroyScene();
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
	loadComponent(route.component, ...args, ...additionnalArgs);
}

const redirect = (path, addToHistory = true, ...args) => {
	let href = window.location.origin + path;
	if (addToHistory)
		window.history.pushState(null, null, href);
	else
		window.history.replaceState(null, null, href);
	loadPage(path.split("?")[0].split("#")[0], ...args);
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
	context.persistent.push({ ok: true, message: message });
}

const persistError = (context, message) => {
	context.persistent.push({ ok: false, message: message });
}

const persistCopy = (context) => {
	let copy = [];
	for (let p of context.persistent)
		copy.push({ ...p });
	return copy;
}

const persist = (context, copy) => {
	for (let p of copy)
		context.persistent.push({ ...p });
}

const loadLang = async (context, lang) => {
	context.lang = await getJson(context, `/static/lang/${lang}.json`);
	if (!context.lang || !context.lang.locale)
		console.error(`[❌] Failed to fetch language file: ${lang}.json`);
	else {
		console.log(`[✅] Loaded language file: ${lang}.json`, context.lang);
		context.langIndex = 0;
		for (let i = 0; i < context.SUPPORTED_LANGS.length; i++)
			if (context.SUPPORTED_LANGS[i] === lang) {
				context.langIndex = i;
				break;
			}
	}
}

const getLang = (context, key, argsList = undefined) => {
	const notFound = `{'${key}' not found}`;
	let pathes = `${key}`.split(".");
	let found = context.lang;
	for (let path of pathes) {
		if (!found[path])
			return notFound;
		found = found[path];
	}
	if (typeof found !== "string")
		return notFound;
	let finalString = "";
	if (argsList)
		for (let i = 0; i < found.length; i++) {
			if (found[i] === "{" && i + 1 < found.length && found[i + 1] === "}")
				finalString += `${argsList.shift()}`;
			else
				finalString += found[i];
		}
	return found;
}

const onLogin = async (context, loadedData = null, reloadNav = false) => {
	var data;
	if (loadedData)
		data = loadedData;
	else
		data = await getJson(context, "/api/user");

	context.chat.ChatConnexion.onOpen(() => {
		if (context.user.token) {
			context.chat.ChatConnexion.authenticate(context.user.token)
				.then(() => {
					console.log("Successfully authenticated in chat")
					getJson(context, '/api/friends/list')
					.then(response => {
						if (response.ok) {
							context.chat.FriendList = response.data.map(e => {
								var res = {
									username: context.user.username === e.author ? e.target : e.author,
									pending: e.pending,
									myRequest: context.user.username === e.author,
								};
								if (res.pending)
									res.myRequest = context.user.username == e.author;
								return (res);
							})
							RefreshFriendList(context);
						} else {
							console.log("Failed to get friend list : " + response.error);
						}
					})
				})
				.catch(err => {
					console.log("Failed to authenticate : " + err);
				})
		}
	})

	if (data.ok) {
		context.user.username = data.username;
		context.user.createdAt = data.createdAt;
		context.user.email = data.email;
		context.user.firstName = data.firstName;
		context.user.lastName = data.lastName;
		context.user.picture = data.picture;
		context.user.lang = data.lang;
		context.user.a2f = data.a2f;
		context.user.isAdmin = data.isAdmin;
		context.user.lastLogin = data.lastLogin;
		context.user.isOauth = data.isOauth;
		await loadLang(context, data.lang);
		if (!context.user.isAuthenticated) {
			context.user.isAuthenticated = true;
			if (reloadNav)
				await overrideNavBar(title, context);
		}
	} else {
		await loadLang(context, SUPPORTED_LANGS[context.langIndex]);
		if (reloadNav)
			await overrideNavBar(title, context);
	}
}

window.addEventListener("load", async () => {
	if (window.location.pathname !== "/" && window.location.pathname.endsWith("/"))
		window.history.pushState(null, null, window.location.pathname.slice(0, -1)
			+ window.location.search + window.location.hash);

	document.body.addEventListener("click", (e) => {
		let elem = e.target;
		while (elem) {
			if (elem.matches("[data-link]")) {
				e.preventDefault();
				let href = elem.href;
				if (href === undefined && elem.getAttribute("href") === null) {
					console.log(`[❌] Failed to get href from element:`, elem);
					return;
				}
				href = window.location.origin + elem.getAttribute("href");
				console.log(`[🔗] Clicked on link: ${href}`);
				window.history.pushState(null, null, href);
				loadPage(new URL(href).pathname);
				return;
			}
			elem = elem.parentElement;
		}
	});

	// onLocationChange (using back/forward buttons)
	window.addEventListener("popstate", () => {
		loadPage(window.location.pathname);
	});

	global_context.user.token = localStorage.getItem("ft_token");
	if (global_context.user.token)
		await onLogin(global_context);
	else
		await loadLang(global_context, SUPPORTED_LANGS[global_context.langIndex]);

	loadPage(window.location.pathname);
});


export {
	loadComponent,
	redirect,
	refresh,
	popNext,
	persistSuccess,
	persistError,
	persistCopy,
	persist,
	loadLang,
	getLang,
	onLogin,
	SUPPORTED_LANGS,
	global_context,
};


console.log("[✅] Scripts loaded successfully!");
