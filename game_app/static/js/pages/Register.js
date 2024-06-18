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

import { checkEmail, checkFirstName, checkLastName, checkPassword, checkPasswords, checkUsername, clearFeedbacks, postJson } from "../utils.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { getLang, persistError, persistSuccess, popNext, redirect } from "../script.js";

function Register(context) {
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
						<label for="password" class="form-label">${getLang(context, "pages.register.labels.password")}</label>
					</div>
					<div class="col-6">
						<input type="password" class="form-control" id="password" placeholder="${getLang(context, "pages.register.placeholders.password")}">
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
		if (form === null)
			return;
		form.onsubmit = (event) => {
			event.preventDefault();
			clearFeedbacks(form);
			if (!checkUsername(context, "#username")
				| !checkFirstName(context, "#first-name")
				| !checkLastName(context, "#last-name")
				| !checkEmail(context, "#email")
				| !checkPassword(context, "#password")
				| !checkPasswords(context, "#password", "#confirmation"))
				return;
			postJson("/api/register", {
				username: document.querySelector("#username").value,
				firstName: document.querySelector("#first-name").value,
				lastName: document.querySelector("#last-name").value,
				email: document.querySelector("#email").value,
				password: document.querySelector("#password").value,
			}).then(data => {
				if (data.ok) {
					persistSuccess(context, getLang(context, data.success));
					redirect(context.next ? popNext(context) : "/");
				} else {
					persistError(context, getLang(context, data.error));
					pushPersistents(context);
				}
			});
		};
	}, 250);
	return div.innerHTML;
}

export { Register };
