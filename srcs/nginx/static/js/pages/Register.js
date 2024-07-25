/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Register.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:24 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:24 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { checkEmail, checkFirstName, checkLastName, checkPassword, checkPasswords, checkUsername, getJson, postJson } from "../utils.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, persistSuccess, popNext, redirect } from "../script.js";
import { Chat } from "../components/Chat.js";


async function Register(context) {
	let div = document.createElement("div");

	div.innerHTML = /*html*/`
		<p><br><br></p>
		<div class="container container-blur form-ssm">
			<form class="row g-3" id="registration-form">
				<div class="row col-12">
					<div class="col-12">
						<label for="username" class="form-label">${getLang(context, "pages.register.labels.username")}</label>
						<input type="text" autocomplete="username" class="form-control" id="username" placeholder="${getLang(context, "pages.register.placeholders.username")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-6">
						<label for="first-name" class="form-label">${getLang(context, "pages.register.labels.firstName")}</label>
						<input type="text" autocomplete="given-name" class="form-control" id="first-name"  placeholder="${getLang(context, "pages.register.placeholders.firstName")}">
					</div>
					<div class="col-6">
						<label for="last-name" class="form-label">${getLang(context, "pages.register.labels.lastName")}</label>
						<input type="text" autocomplete="family-name" class="form-control" id="last-name" placeholder="${getLang(context, "pages.register.placeholders.lastName")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<label for="email" class="form-label">${getLang(context, "pages.register.labels.email")}</label>
						<input type="email" autocomplete="email" class="form-control" id="email" placeholder="${getLang(context, "pages.register.placeholders.email")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<label for="new-password" class="form-label">${getLang(context, "pages.register.labels.password")}</label>
					</div>
					<div class="col-6">
						<input type="password" autocomplete="new-password" class="form-control" id="new-password" placeholder="${getLang(context, "pages.register.placeholders.password")}">
					</div>
					<div class="col-6">
						<input type="password" autocomplete="new-password" class="form-control" id="confirmation" placeholder="${getLang(context, "pages.register.placeholders.confirmPassword")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12 text-center"><br></div>
				</div>

				<div class="row col-12">
					<div class="col-12 text-center" id="abc">
						${getLang(context, "pages.register.haveAccount")} &nbsp; • &nbsp; <a href="/login${window.location.search}${window.location.hash}" data-link>${getLang(context, "pages.register.labels.login")}</a>
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<button class="btn btn-primary" type="submit">${getLang(context, "pages.register.labels.register")}</button>
					</div>
				</div>

				<div class="sep"></div>

				<div class="row col-12">
					<div class="col-12">
						<button class="btn btn-oauth" id="signup-oauth">${getLang(context, "pages.register.labels.register42")}</button>
					</div>
				</div>
			</form>
		</div>
	`;

	div.insertBefore(Persistents(context), div.firstChild);
	div.insertBefore(await NavBar(getLang(context, "pages.register.title"), context), div.firstChild);
	div.appendChild(Chat(context));

	let form = div.querySelector("#registration-form");
	let inputUsername = div.querySelector("#username");
	let inputFirstName = div.querySelector("#first-name");
	let inputLastName = div.querySelector("#last-name");
	let inputEmail = div.querySelector("#email");
	let inputPassword = div.querySelector("#new-password");
	let inputConfirmation = div.querySelector("#confirmation");
	let signup_oauth = div.querySelector("#signup-oauth");

	if (inputUsername !== null)
		inputUsername.oninput = () => checkUsername(context, "#username");

	if (inputFirstName !== null)
		inputFirstName.oninput = () => checkFirstName(context, "#first-name");

	if (inputLastName !== null)
		inputLastName.oninput = () => checkLastName(context, "#last-name");

	if (inputEmail !== null)
		inputEmail.oninput = () => checkEmail(context, "#email");

	if (inputPassword !== null)
		inputPassword.oninput = () => checkPassword(context, "#new-password")
			| checkPasswords(context, "#new-password", "#confirmation");

	if (inputConfirmation !== null)
		inputConfirmation.oninput = () => checkPassword(context, "#new-password")
			| checkPasswords(context, "#new-password", "#confirmation");

	if (form !== null)
		form.onsubmit = (event) => {
			event.preventDefault();
			if (!checkUsername(context, "#username")
				| !checkFirstName(context, "#first-name")
				| !checkLastName(context, "#last-name")
				| !checkEmail(context, "#email")
				| !checkPassword(context, "#new-password")
				| !checkPasswords(context, "#new-password", "#confirmation"))
				return;
			postJson(context, "/api/register", {
				username: div.querySelector("#username").value,
				firstName: div.querySelector("#first-name").value,
				lastName: div.querySelector("#last-name").value,
				email: div.querySelector("#email").value,
				password: div.querySelector("#new-password").value,
			}).then(data => {
				if (data.ok) {
					persistSuccess(context, getLang(context, data.success));
					/// todo see if remove: set auth token but redirect to login page ???
					// try {
					// 	context.user.token = data.token;
					// 	localStorage.setItem("ft_token", data.token);
					// } catch (e) {
					// 	console.log("[❌] Token could not be saved in localStorage.");
					// }
					redirect("/login" + (context.next ? "?next=" + context.next : ""));
				} else {
					persistError(context, getLang(context, data.error));
					pushPersistents(context);
				}
			});
		};

	if (signup_oauth)
		signup_oauth.onclick = (event) => {
			event.preventDefault();
			getJson(context, "/api/oauth42").then(data => {
				if (data.ok) {
					window.location.href = `https://api.intra.42.fr/oauth/authorize?client_id=${data.token}&redirect_uri=https%3A%2F%2F127.0.0.1%3A4444%2Foauth_callback&response_type=code`;
				} else {
					persistError(context, getLang(context, data.error));
					pushPersistents(context);
				}
			});
		};
	return div;
}


export { Register };
