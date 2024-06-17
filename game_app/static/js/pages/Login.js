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
			if (!checkUsername(context, "#username") | !checkPassword(context, "#password")) // wtf qui fait ses OR comme ca ptdr
				return;
			var a2f_input = document.getElementById("a2f_code");
			if (a2f_input)
				a2f_input = a2f_input.value.toString();
			if (a2f_input != undefined && a2f_input.length != 6)
			{
				persistError(context, getLang(context, "errors.a2fBadLength"));
				overridePersistents(context);
				return ;
			}
			postJson("/api/login", {
				username: document.querySelector("#username").value,
				password: document.querySelector("#password").value,
				a2f_code: a2f_input
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
					context.user.is_authenticated = false;
					if (data.error == "errors.missingA2F") {
						var a2f_code = document.getElementById("a2f_code");
						if (!a2f_code)
						{
							var loginForm = document.getElementById("login-form");
							loginForm.insertBefore(createA2fInput(context), loginForm.childNodes[5]);
						}
					} else {
						persistError(context, getLang(context, data.error));
						overridePersistents(context);
					}
				}
			});
		};
	}, 250);
	return div.innerHTML;
}

export { Login };
