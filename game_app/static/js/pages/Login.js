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
import { persistError, persistSuccess, popNext, redirect, refresh } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";

function Login(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Login", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div class="container container-blur form-ssm">
			<form class="row g-3" id="login-form">
				<div class="row col-12">
					<div class="col-12">
						<label for="username" class="form-label">Username</label>
						<input type="text" class="form-control" id="username" placeholder="ft_transcender">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<label for="password" class="form-label">Password</label>
						<input type="password" class="form-control" id="password" placeholder="Enter a string one...">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12 text-center"><br></div>
				</div>

				<div class="row col-12">
					<div class="col-12 text-center">
						Don't have an account? &nbsp; • &nbsp; <a href="/register">Register</a>
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<button class="btn btn-primary" type="submit">Login</button>
					</div>
				</div>
			</form>
		</div>
	`;
	setTimeout(() => {
		if (context.user.is_authenticated) {
			if (context.next)
				redirect(popNext(context));
			else if (window.history.length > 1)
				window.history.back();
			else
				redirect("/");
			return;
		}
		let form = document.querySelector("#login-form");
		if (form === null)
			return;
		form.onsubmit = (event) => {
			event.preventDefault();
			clearFeedbacks(form);
			if (!checkUsername("#username") | !checkPassword("#password"))
				return;
			postJson("/api/login", {
				username: document.querySelector("#username").value,
				password: document.querySelector("#password").value,
			}).then(data => {
				if (data.ok) {
					persistSuccess(context, data.success);
					context.user.username = data.username;
					context.user.firstName = data.firstName;
					context.user.lastName = data.lastName;
					context.user.email = data.email;
					context.user.is_authenticated = true;
				} else {
					persistError(context, data.error);
					context.user.is_authenticated = false;
				}
				redirect(context.next ? popNext(context) : "/");
			});
		};
	}, 250);
	return div.outerHTML;
}

export { Login };
