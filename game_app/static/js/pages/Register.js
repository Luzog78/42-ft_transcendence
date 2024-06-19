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

import { checkEmail, checkFirstName, checkLastName, checkPassword, checkPasswords, checkUsername, postJson } from "../utils.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, persistSuccess, popNext, redirect } from "../script.js";

async function Register(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.register.title"), context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div class="container container-blur form-ssm">
			<form class="row g-3" id="registration-form">
				<div class="row col-12">
					<div class="col-12">
						<label for="username" class="form-label">${getLang(context, "pages.register.labels.username")}</label>
						<input type="text" class="form-control" id="username" placeholder="${getLang(context, "pages.register.placeholders.username")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-6">
						<label for="first-name" class="form-label">${getLang(context, "pages.register.labels.firstName")}</label>
						<input type="text" class="form-control" id="first-name"  placeholder="${getLang(context, "pages.register.placeholders.firstName")}">
					</div>
					<div class="col-6">
						<label for="last-name" class="form-label">${getLang(context, "pages.register.labels.lastName")}</label>
						<input type="text" class="form-control" id="last-name" placeholder="${getLang(context, "pages.register.placeholders.lastName")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<label for="email" class="form-label">${getLang(context, "pages.register.labels.email")}</label>
						<input type="email" class="form-control" id="email" placeholder="${getLang(context, "pages.register.placeholders.email")}">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<label for="new-password" class="form-label">${getLang(context, "pages.register.labels.password")}</label>
					</div>
					<div class="col-6">
						<input type="password" class="form-control" id="new-password" placeholder="${getLang(context, "pages.register.placeholders.password")}">
					</div>
					<div class="col-6">
						<input type="password" class="form-control" id="confirmation" placeholder="${getLang(context, "pages.register.placeholders.confirmPassword")}">
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
			</form>
		</div>
	`;
	setTimeout(() => {
		let form = document.querySelector("#registration-form");
		let inputUsername = document.querySelector("#username");
		let inputFirstName = document.querySelector("#first-name");
		let inputLastName = document.querySelector("#last-name");
		let inputEmail = document.querySelector("#email");
		let inputPassword = document.querySelector("#new-password");
		let inputConfirmation = document.querySelector("#confirmation");

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
					username: document.querySelector("#username").value,
					firstName: document.querySelector("#first-name").value,
					lastName: document.querySelector("#last-name").value,
					email: document.querySelector("#email").value,
					password: document.querySelector("#new-password").value,
				}).then(data => {
					if (data.ok) {
						persistSuccess(context, getLang(context, data.success));
						try {
							localStorage.setItem("ft_token", data.token);
							context.user.token = data.token;
						} catch (e) {
							console.log("[❌] Token could not be saved in localStorage.");
						}
						redirect("/login?next=" + context.next);
					} else {
						persistError(context, getLang(context, data.error));
						pushPersistents(context);
					}
				});
			};
	}, 200);
	return div.innerHTML;
}

export { Register };
