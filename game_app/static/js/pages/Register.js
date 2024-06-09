import { checkEmail, checkFirstName, checkLastName, checkPassword, checkPasswords, checkUsername, clearFeedbacks, postJson } from "../utils.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { persistError, persistSuccess, popNext, redirect, refresh } from "../script.js";

function Register(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Register", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div class="container container-blur form-ssm">
			<form class="row g-3" id="registration-form">
				<div class="row col-12">
					<div class="col-12">
						<label for="username" class="form-label">Username</label>
						<input type="text" class="form-control" id="username" placeholder="ft_transcender">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-6">
						<label for="first-name" class="form-label">First name</label>
						<input type="text" class="form-control" id="first-name"  placeholder="Doc">
					</div>
					<div class="col-6">
						<label for="last-name" class="form-label">Last name</label>
						<input type="text" class="form-control" id="last-name" placeholder="... nobody knows...">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<label for="email" class="form-label">Email</label>
						<input type="email" class="form-control" id="email" placeholder="doc@42.fr">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<label for="password" class="form-label">Password</label>
					</div>
					<div class="col-6">
						<input type="password" class="form-control" id="password" placeholder="Enter a string one...">
					</div>
					<div class="col-6">
						<input type="password" class="form-control" id="confirmation" placeholder="Confirmation">
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12 text-center"><br></div>
				</div>

				<div class="row col-12">
					<div class="col-12 text-center" id="abc">
						Already have an account? &nbsp; • &nbsp; <a href="/login">Login</a>
					</div>
				</div>

				<div class="row col-12">
					<div class="col-12">
						<button class="btn btn-primary" type="submit">Register</button>
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
			if (!checkUsername("#username")
				| !checkFirstName("#first-name")
				| !checkLastName("#last-name")
				| !checkEmail("#email")
				| !checkPassword("#password")
				| !checkPasswords("#password", "#confirmation"))
				return;
			postJson("/api/register", {
				username: document.querySelector("#username").value,
				firstName: document.querySelector("#first-name").value,
				lastName: document.querySelector("#last-name").value,
				email: document.querySelector("#email").value,
				password: document.querySelector("#password").value,
			}).then(data => {
				if (data.ok) {
					persistSuccess(context, data.success);
					redirect(context.next ? popNext(context) : "/login");
				} else {
					persistError(context, data.error);
					refresh();
				}
			});
		};
	}, 250);
	return div.outerHTML;
}

export { Register };
