/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Login.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:13 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:13 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { checkA2F, checkPassword, checkUsername, postJson } from "../utils.js";
import { getLang, persistError, persistSuccess, popNext, redirect } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";

function createA2fInput(context) {
	var row = document.createElement("div");
	row.classList.add("row", "col-12");

	var col = document.createElement("div");
	col.classList.add("col-12");

	var label = document.createElement("label");
	label.setAttribute("for", "a2f_code");
	label.classList.add("form-label");
	label.innerText = getLang(context, "pages.login.labels.a2f");

	var input = document.createElement("input");
	input.type = "number";
	input.classList.add("form-control", "no-arrow")
	input.id = "a2f_code"
	input.minLength = 6;
	input.maxLength = 6;
	input.placeholder = getLang(context, "pages.login.placeholders.login.a2f");

	col.appendChild(label);
	col.appendChild(input);
	row.appendChild(col);

	return row;
}

async function Login(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.login.title"), context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div class="container container-blur form-ssm">
			<form class="row g-3" id="login-form">
				<div class="row col-12">
					<div class="col-12">
						<label for="username" class="form-label">${getLang(context, "pages.login.labels.username")}</label>
						<input type="text" class="form-control" id="username" placeholder="${getLang(context, "pages.login.placeholders.username")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<label for="password" class="form-label">${getLang(context, "pages.login.labels.password")}</label>
						<input type="password" class="form-control" id="password" placeholder="${getLang(context, "pages.login.placeholders.password")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12 text-center"><br></div>
				</div>

				<div class="row col-12">
					<div class="col-12 text-center">
						${getLang(context, "pages.login.dontHaveAccount")} &nbsp; • &nbsp; <a href="/register${window.location.search}${window.location.hash}" data-link>${getLang(context, "pages.login.labels.register")}</a>
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<button class="btn btn-primary" type="submit">${getLang(context, "pages.login.labels.login")}</button>
					</div>
				</div>
			</form>
		</div>
	`;
	const foo = () => {
		let form = document.querySelector("#login-form");
		let inputUsername = document.querySelector("#username");
		let inputPassword = document.querySelector("#password");
		let inputA2f = document.querySelector("#a2f_code");

		if (inputUsername !== null)
			inputUsername.oninput = () => checkUsername(context, "#username");

		if (inputPassword !== null)
			inputPassword.oninput = () => checkPassword(context, "#password");

		if (inputA2f !== null)
			inputA2f.oninput = () => checkA2F(context, "#a2f_code");

		if (form !== null)
			form.onsubmit = (event) => {
				event.preventDefault();
				if (!checkUsername(context, "#username")
					| !checkPassword(context, "#password")
					| !checkA2F(context, "#a2f_code", true))
					return;
				postJson(context, "/api/login", {
					username: document.querySelector("#username").value,
					password: document.querySelector("#password").value,
					a2f_code: document.querySelector("#a2f_code") ? document.querySelector("#a2f_code").value : null
				}).then(data => {
					if (data.ok) {
						persistSuccess(context, getLang(context, data.success));
						try {
							localStorage.setItem("ft_token", data.token);
						} catch (e) {
							console.log("[❌] Token could not be saved in localStorage.");
						}
						context.user.isAuthenticated = true;
						context.user.token = data.token;
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
						if (context.ChatConnexion.connected) {
							context.ChatConnexion.authenticate(context.user.token)
								.then(() => {
									console.log("Successfully authenticated in chat")
								})
								.catch(err => {
									console.log("Failed to authenticate : " + err.error);
								})
						}
						redirect(context.next ? popNext(context) : "/");
					} else if (data.error == "errors.missingA2F") {
						context.user.isAuthenticated = false;
						var a2f_code = document.getElementById("a2f_code");
						if (!a2f_code)
						{
							var loginForm = document.getElementById("login-form");
							loginForm.insertBefore(createA2fInput(context), loginForm.childNodes[5]);
						}
					} else {
						persistError(context, getLang(context, data.error));
						context.user.isAuthenticated = false;
						pushPersistents(context);
					}
				});
			};
	};
	if (context.user.token && !context.user.isAuthenticated)
		setTimeout(() => {
			if (context.user.isAuthenticated) {
				let next;
				while (context.next && (next = popNext(context)) == window.location.pathname);
				if (context.next)
						redirect(next);
				if (window.history.length > 1)
					window.history.back();
				else
					redirect("/");
				return;
			}
			foo();
		}, 500);
	else
		setTimeout(foo, 200);
	return div.innerHTML;
}

export { Login };
