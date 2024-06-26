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
import { Err404 } from "./pages/Err404.js";
import { Profile } from "./pages/Profile.js";
import { Play } from "./pages/Play.js";
import { PlayId } from "./pages/PlayId.js";
import { Pong } from "./pages/Pong.js";
import { PongResult } from "./pages/PongResult.js";
import { GameConfig} from "./pages/GameConfig.js";
import { Settings } from "./pages/Settings.js";

import { ChatConnexion } from "./ChatConnexion.js";

import { getJson } from "./utils.js";
import { destroyScene } from "./pong_game/main.js";
import { Tournament } from "./pages/Tournament.js";


const SUPPORTED_LANGS = ["en", "fr"];
const DEFAULT_LANG = SUPPORTED_LANGS[0];

var global_context = {
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
	},
	persistent: [],
	next: null,
	ChatConnexion: new ChatConnexion(),
};

/// test + exemple but still test only
// global_context.ChatConnexion.onOpen(() => {
// 	if (localStorage.getItem("ft_token")) {
// 		global_context.ChatConnexion.authenticate(localStorage.getItem("ft_token"))
// 			.then(() => {
// 				global_context.ChatConnexion.sendMessage("abcd", "yo")
// 					.then(messageData => {
// 						console.log(`Message successfully sent, id: ${messageData["messageId"]}`)
// 					})
// 					.catch((err) => {
// 						console.log("failed to send message : ", err)
// 					})
// 				global_context.ChatConnexion.getAllMessages()
// 					.then(messages => {
// 						console.log("messages table: ", messages)
// 					})
// 					.catch(err => {
// 						console.log("failed to fetch messages : ", err)
// 					})
// 			})
// 			.catch(err => {
// 				console.log("failed to auth : ", err)
// 			})
// 	}
// })

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
		path: "/play/<any>",
		component: PlayId,
	},
	{
		path: "/pong",
		component: Pong,
	},
	{
		path: "/result/<numbers>",
		component: PongResult,
	},
	{
		path: "/new",
		component: GameConfig,
	},
	{
		path: "/tournament",
		component: Tournament,
	},
	{
		path: "/tournament/<numbers>",
		component: Tournament,
	},
];

const content = document.getElementById("body-content");

const loadComponent = async (component, ...args) => {
	if (component === null || component === undefined)
		return;
	let inner = await component(global_context, ...args);
	if (inner === null || inner === undefined)
		return;
	content.innerHTML = inner;
}

const loadPage = (path) => {
	console.log(`[🔀] Loading page: ${path}`);
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
	loadComponent(route.component, ...args);
}

const redirect = (path, addToHistory = true) => {
	let href = window.location.origin + path;
	if (addToHistory)
		window.history.pushState(null, null, href);
	else
		window.history.replaceState(null, null, href);
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
	if (!context.lang.locale)
		console.error(`[❌] Failed to fetch language file: ${lang}.json`);
	else
		console.log(`[✅] Loaded language file: ${lang}.json`, context.lang);
}

const getLang = (context, key) => {
	const notFound = `{'${key}' not found}`;
	let pathes = key.split(".");
	let found = context.lang;
	for (let path of pathes) {
		if (!found[path])
			return notFound;
		found = found[path];
	}
	if (typeof found !== "string")
		return notFound;
	return found;
}

const onLogin = async (context, loadedData=null, reloadNav=false) => {
	var data;
	if (loadedData)
		data = loadedData;
	else
		data = getJson(context, "/api/user")

	context.ChatConnexion.onOpen(() => {
		if (context.user.token) {
			context.ChatConnexion.authenticate(context.user.token)
				.then(() => {
					console.log("Successfully authenticated in chat")
				})
				.catch(err => {
					console.log("Failed to authenticate : " + err.error);
				})
		}
	})

	if (!loadedData)
		data = await data
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
		if (!context.user.isAuthenticated) {
			context.user.isAuthenticated = true;
			if (reloadNav)
				overrideNavBar(title, context);
		}
		await loadLang(context, data.lang);
	}
	else
		await loadLang(context, DEFAULT_LANG);


}

window.addEventListener("load", async () => {
	if (window.location.pathname !== "/" && window.location.pathname.endsWith("/"))
		window.history.pushState(null, null, window.location.pathname.slice(0, -1)
			+ window.location.search + window.location.hash);

	document.body.addEventListener("click", (e) => {
		if (e.target.matches("[data-link]")) {
			e.preventDefault();
			let target = e.target;
			if (target.href === undefined)
				target = target.parentElement;
			window.history.pushState(null, null, target.href);
			loadPage(new URL(target.href).pathname);
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
		await loadLang(global_context, DEFAULT_LANG);

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
	DEFAULT_LANG,
};


console.log("[✅] Scripts loaded successfully!");
