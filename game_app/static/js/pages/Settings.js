/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Settings.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42angouleme.fr    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/17 20:53:01 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/21 00:44:18 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";
import { SUPPORTED_LANGS, getLang, loadLang, persist, persistCopy, persistError, persistSuccess, redirect, refresh } from "../script.js";
import { checkA2F, checkEmail, checkFirstName, checkLastName, checkPassword, checkPasswords, clearFeedbacks, postJson } from "../utils.js";


async function setUserAttributes(context, data) {
	return postJson(context, `/api/user/${context.user.username}/set`, data)
		.then(data => {
			if (data.successes)
				for (let key in data.successes)
					persistSuccess(context, getLang(context, data.successes[key]));
			if (data.errors)
				for (let key in data.errors)
					persistError(context, getLang(context, data.errors[key]));
			if (!data.ok)
				persistError(context, "[FATAL] " + getLang(context, data.error));
			return data;
		});
}


function Settings(context) {
	let persistentBackup = persistCopy(context);
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.profile.title"), context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div id="settings-content" class="block-blur">
			<div class="block-blur-pad"></div>
			<div class="container-fluid">

				<div class="left">
					<form action="GET">
						<img id="profile-picture" src="/static/img/user.svg" alt="${getLang(context, "pages.settings.profilePictureAlt")}">
						<input type="file" name="editProfilePicture" id="editProfilePicture" style="display: none;">
					</form>
					<div id="profile-name">${getLang(context, "loading")}</div>
					<div class="lang">
						Lang &nbsp; &bull; &nbsp;
						<span class="trigger">
							<span id="lang">${getLang(context, "locale")}</span>
							&nbsp;
							<img id="lang-img" src="${getLang(context, "iconURL")}" alt="${getLang(context, "iconAlt")}">
						</span>
					</div>
				</div>

				<div class="right">

					<a id="back" href="/profile" class="a-no-style" data-link>
						<img src="/static/img/back.svg" alt="back" data-link>
					</a>

					<h1>${getLang(context, "pages.settings.title")}</h1>
					<hr>

					<div class="settings">
						<h4 class="title">${getLang(context, "pages.settings.titles.personal")}</h4>
						<form action="GET" class="form-ssm" id="personal-form">
							<div class="row col-12">
								<div class="col-6">
									<label for="editFirstName" class="form-label">
										${getLang(context, "pages.settings.labels.firstName")}
									</label>
									<input type="text" class="form-control" id="editFirstName" name="editFirstName" placeholder="${getLang(context, "pages.settings.placeholders.firstName")}" required>
								</div>
								<div class="col-6">
									<label for="editLastName" class="form-label">
										${getLang(context, "pages.settings.labels.lastName")}
									</label>
									<input type="text" class="form-control" id="editLastName" name="editLastName" placeholder="${getLang(context, "pages.settings.placeholders.lastName")}" required>
								</div>
							</div>

							<div class="sep"></div>

							<div class="row col-12">
								<div class="col-12">
									<button class="btn btn-secondary" type="submit" disabled>
										${getLang(context, "pages.settings.labels.update")}
									</button>
								</div>
							</div>
						</form>

						<div class="sep"></div>
						<div class="sep"></div>
						<div class="sep"></div>

						<form action="GET" class="form-ssm" id="email-form">
							<div class="row col-12">
								<div class="col-12">
									<label for="editEmail" class="form-label">
										${getLang(context, "pages.settings.labels.email")}
									</label>
									<input type="email" class="form-control" id="editEmail" name="editEmail" placeholder="${getLang(context, "pages.settings.placeholders.email")}" required>
								</div>
							</div>

							<div class="sep"></div>

							<div class="row col-12">
								<div class="col-12">
									<button class="btn btn-secondary" type="submit" disabled>
										${getLang(context, "pages.settings.labels.update")}
									</button>
								</div>
							</div>
						</form>
						<hr>
					</div>

					<div class="settings">
						<h4 class="title">${getLang(context, "pages.settings.titles.security")}</h4>
						<form action="GET" class="form-ssm" id="security-form">
							<div class="row col-12">
								<div class="col-12">
									<label for="editNewPass" class="form-label">
										${getLang(context, "pages.settings.labels.oldPassword")}
									</label>
									<input type="password" class="form-control" id="editNewPassOld" name="editNewPassOld" placeholder="${getLang(context, "pages.settings.placeholders.oldPassword")}" required>
								</div>
							</div>
							<div class="row col-12">
								<div class="col-12">
									<label for="editNewPass" class="form-label">
										${getLang(context, "pages.settings.labels.password")}
									</label>
									<input type="password" class="form-control" id="editNewPass" name="editNewPass" placeholder="${getLang(context, "pages.settings.placeholders.password")}" required>
								</div>
							</div>
							<div class="row col-12">
								<div class="col-12">
									<label for="editNewPassConfirm" class="form-label">
										${getLang(context, "pages.settings.labels.confirmPassword")}
									</label>
									<input type="password" class="form-control" id="editNewPassConfirm" name="editNewPassConfirm" placeholder="${getLang(context, "pages.settings.placeholders.confirmPassword")}" required>
								</div>
							</div>

							<div class="sep"></div>

							<div class="row col-12">
								<div class="col-12">
									<button class="btn btn-secondary" type="submit" disabled>
										${getLang(context, "pages.settings.labels.update")}
									</button>
								</div>
							</div>
						</form>
						<hr>
					</div>

					<div class="settings">
						<h4 class="title">${getLang(context, "pages.settings.titles.a2f")}</h4>
						<div class="btn-group row col-12" role="group">
							<button type="button" class="btn btn-outline-danger col-6" id="editDisabled">
								${getLang(context, "pages.settings.labels.disabled")}
							</button>
							<button type="button" class="btn btn-outline-success col-6" id="editEnabled">
								${getLang(context, "pages.settings.labels.enabled")}
							</button>
						</div>

						<div class="sep"></div>
						<div class="sep"></div>
						<div class="sep"></div>

						<form action="GET" class="form-ssm" id="2fa-form">
							<div class="row col-12">
								<label for="editToken" class="form-label">
									${getLang(context, "pages.settings.labels.token")}
								</label>
							</div>
							<div class="row col-12">
								<div class="col-8" style="padding-right: 0;">
									<input type="text" class="form-control" id="editToken" name="editToken" placeholder="${getLang(context, "pages.settings.placeholders.token")}" required>
								</div>
								<div class="col-4" style="padding-left: 6px;">
									<button class="btn btn-secondary" type="submit" disabled>
										${getLang(context, "pages.settings.labels.update")}
									</button>
								</div>
							</div>
						</form>
						<hr>
					</div>

					<div class="settings">
						<div id="btn-delete" class="progress" role="progressbar">
							<div id="btn-delete-text" class="progress-bar progress-bar-striped progress-bar-animated bg-danger" style="width: 100%">
								${getLang(context, "pages.settings.labels.delete")}
							</div>
						</div>
					</div>

				</div>

			</div>
			<div class="block-blur-pad"></div>
		</div>
	`;
	setTimeout(() => {
		if (!context.user.isAuthenticated || !context.user.username) {
			persist(context, persistentBackup);
			persistError(context, getLang(context, "errors.mustBeLoggedIn"));
			redirect("/login?next=" + window.location.pathname);
			return;
		}

		let profilePicture = document.getElementById("profile-picture");
		let editProfilePicture = document.getElementById("editProfilePicture");
		let profileName = document.getElementById("profile-name");
		let lang = document.getElementById("lang");

		if (profileName)
			profileName.innerHTML = context.user.username;

		if (context.user.picture) {
			profilePicture.src = context.user.picture;
			profilePicture.addEventListener("click", () => {
				if (editProfilePicture)
					editProfilePicture.click();
			});
		}

		if (editProfilePicture) {
			editProfilePicture.addEventListener("change", (e) => {
				let file = e.target.files[0];
				// if (file) {
				// 	let reader = new FileReader();
				// 	reader.onload = (e) => {
				// 		profilePicture.src = e.target.result;
				// 	}
				// 	reader.readAsDataURL(file);
				// }
				console.log("File:", file);
			});
		}

		if (lang) {
			lang.parentElement.addEventListener("click", () => {
				let i = 1;
				for (let l of SUPPORTED_LANGS) {
					if (context.lang.locale === l)
						break;
					i++;
				}
				if (i >= SUPPORTED_LANGS.length)
					i = 0;
				setUserAttributes(context, { lang: SUPPORTED_LANGS[i] })
					.then(data => {
						if (data.ok)
							loadLang(context, SUPPORTED_LANGS[i]).then(() => refresh());
						else
							refresh();
					});
			});
		}

		let personalForm = document.getElementById("personal-form");
		let editFirstName = document.getElementById("editFirstName");
		let editLastName = document.getElementById("editLastName");

		let emailForm = document.getElementById("email-form");
		let editEmail = document.getElementById("editEmail");

		let securityForm = document.getElementById("security-form");
		let editNewPassOld = document.getElementById("editNewPassOld");
		let editNewPass = document.getElementById("editNewPass");
		let editNewPassConfirm = document.getElementById("editNewPassConfirm");

		let editDisabled = document.getElementById("editDisabled");
		let editEnabled = document.getElementById("editEnabled");

		let a2fForm = document.getElementById("2fa-form");
		let editToken = document.getElementById("editToken");

		let btnDelete = document.getElementById("btn-delete");
		let btnDeleteText = document.getElementById("btn-delete-text");
		let deleteLevel = 0;

		if (personalForm && editFirstName && editLastName) {
			editFirstName.value = context.user.firstName;
			editLastName.value = context.user.lastName;

			function checkActivation() {
				clearFeedbacks(personalForm);
				if (!checkFirstName(context, "#editFirstName") | !checkLastName(context, "#editLastName"))
					return;
				let button = personalForm.querySelector("button[type=submit]");
				if (editFirstName.value !== context.user.firstName || editLastName.value !== context.user.lastName) {
					button.removeAttribute("disabled");
					button.classList.remove("btn-secondary");
					button.classList.add("btn-success");
				} else {
					button.setAttribute("disabled", "");
					button.classList.remove("btn-success");
					button.classList.add("btn-secondary");
				}
			}

			editFirstName.addEventListener("input", checkActivation);
			editLastName.addEventListener("input", checkActivation);
			personalForm.addEventListener("submit", (e) => {
				e.preventDefault();
				setUserAttributes(context, {
					firstName: editFirstName.value,
					lastName: editLastName.value,
				}).then(data => refresh());
			});
		}

		if (emailForm && editEmail) {
			editEmail.value = context.user.email;

			editEmail.addEventListener("input", () => {
				clearFeedbacks(emailForm);
				if (!checkEmail(context, "#editEmail"))
					return;
				let button = emailForm.querySelector("button[type=submit]");
				if (editEmail.value !== context.user.email) {
					button.removeAttribute("disabled");
					button.classList.remove("btn-secondary");
					button.classList.add("btn-success");
				} else {
					button.setAttribute("disabled", "");
					button.classList.remove("btn-success");
					button.classList.add("btn-secondary");
				}
			});
			emailForm.addEventListener("submit", (e) => {
				e.preventDefault();
				setUserAttributes(context, {
					email: editEmail.value
				}).then(data => refresh());
			});
		}

		if (securityForm && editNewPassOld && editNewPass && editNewPassConfirm) {
			function checkActivation() {
				clearFeedbacks(securityForm);
				if (!checkPassword(context, "#editNewPassOld")
					| !checkPassword(context, "#editNewPass")
					| !checkPasswords(context, "#editNewPass", "#editNewPassConfirm"))
					return;
				let button = securityForm.querySelector("button[type=submit]");
				if (editNewPassOld !== "" && editNewPass.value !== "" && editNewPass.value === editNewPassConfirm.value) {
					button.removeAttribute("disabled");
					button.classList.remove("btn-secondary");
					button.classList.add("btn-success");
				} else {
					button.setAttribute("disabled", "");
					button.classList.remove("btn-success");
					button.classList.add("btn-secondary");
				}
			}

			editNewPassOld.addEventListener("input", checkActivation);
			editNewPass.addEventListener("input", checkActivation);
			editNewPassConfirm.addEventListener("input", checkActivation);
			securityForm.addEventListener("submit", (e) => {
				e.preventDefault();
				setUserAttributes(context, {
					oldPassword: editNewPassOld.value,
					password: editNewPass.value
				}).then(data => refresh());
			});
		}

		if (editDisabled && editEnabled) {
			if (context.user.a2f) {
				editEnabled.classList.remove("btn-outline-success");
				editEnabled.classList.add("btn-success");
				editDisabled.classList.remove("btn-danger");
				editDisabled.classList.add("btn-outline-danger");

				editDisabled.addEventListener("click", () =>
					setUserAttributes(context, { a2f: null }).then(data => refresh()));
			} else {
				editDisabled.classList.remove("btn-outline-danger");
				editDisabled.classList.add("btn-danger");
				editEnabled.classList.remove("btn-success");
				editEnabled.classList.add("btn-outline-success");

				editEnabled.addEventListener("click", () => {
					persistSuccess(context, getLang(context, "pages.settings.useToken"));
					pushPersistents(context);
				});
			}
		}

		if (a2fForm && editToken) {
			editToken.addEventListener("input", () => {
				if (!checkA2F(context, "#editToken"))
					return;
				let button = a2fForm.querySelector("button[type=submit]");
				if (editToken.value !== "") {
					button.removeAttribute("disabled");
					button.classList.remove("btn-secondary");
					button.classList.add("btn-success");
				} else {
					button.setAttribute("disabled", "");
					button.classList.remove("btn-success");
					button.classList.add("btn-secondary");
				}
			});
			a2fForm.addEventListener("submit", (e) => {
				e.preventDefault();
				setUserAttributes(context, {
					a2f: editToken.value
				}).then(data => refresh());
			});
		}

		if (btnDelete && btnDeleteText) {
			btnDelete.addEventListener("click", () => {
				if (deleteLevel === 0) {
					btnDeleteText.innerText = getLang(context, "pages.settings.labels.deleteConfirm");
					deleteLevel++;
				} else if (deleteLevel === 1) {
					btnDeleteText.innerText = getLang(context, "pages.settings.labels.deleteLastChance");
					deleteLevel++;
				} else if (deleteLevel === 2) {
					btnDeleteText.innerText = getLang(context, "pages.settings.labels.deleteFinal");
					deleteLevel++;
				} else {
					postJson(context, `/api/user/${context.user.username}/del`).then(data => {
						if (!data.ok) {
							persistError(context, getLang(context, data.error));
							refresh();
						} else
							redirect("/logout?next=/");
					});
				}
			});
		}
	}, 200);
	return div.innerHTML;
}

export { Settings }
