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

import { checkPassword, checkUsername, clearFeedbacks, postJson } from "../utils.js";
import { getLang, persistError, persistSuccess, popNext, redirect } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents, overridePersistents } from "../components/Persistents.js";

function Login(context) {
	if (context.user.is_authenticated) {
		if (context.next)
			redirect(popNext(context));
		else if (window.history.length > 1)
			window.history.back();
		else
			redirect("/");
		return;
	}
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
						${getLang(context, "pages.login.dontHaveAccount")} &nbsp; • &nbsp; <a href="/register${window.location.search}${window.location.hash}">${getLang(context, "pages.login.labels.register")}</a>
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
	setTimeout(() => {
		let form = document.querySelector("#login-form");
		if (form === null)
			return;
		form.onsubmit = (event) => {
			event.preventDefault();
			clearFeedbacks(form);
			if (!checkUsername(context, "#username") | !checkPassword(context, "#password"))
				return;
			postJson("/api/login", {
				username: document.querySelector("#username").value,
				password: document.querySelector("#password").value,
			}).then(data => {
				if (data.ok) {
					persistSuccess(context, getLang(context, data.success));
					context.user.username = data.username;
					context.user.firstName = data.firstName;
					context.user.lastName = data.lastName;
					context.user.email = data.email;
					context.user.is_authenticated = true;
					redirect(context.next ? popNext(context) : "/");
				} else {
					persistError(context, getLang(context, data.error));
					context.user.is_authenticated = false;
					overridePersistents(context);
				}
			});
		};
	}, 250);
	return div.innerHTML;
}

export { Login };
