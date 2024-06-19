/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   utils.js                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:41 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:41 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getLang } from "./script.js";

function postJson(context, url, data, jsonify = true) {
	let promise = fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Authorization": "Bearer " + context.user.token,
		},
		body: JSON.stringify(data),
	});
	if (jsonify)
		promise = promise.then(res => res.json());
	return promise;
}

function getJson(context, url) {
	return fetch(url, {
		method: "GET",
		headers: {
			"Authorization": "Bearer " + context.user.token,
		},
	}).then(res => res.json());
}

function validFeedback(child, message) {
	let parent = child.parentElement;

	child.classList.remove("is-valid");
	child.classList.remove("is-invalid");
	let invalid = parent.querySelector(".invalid-feedback");
	if (invalid)
		invalid.remove();
	let valid = parent.querySelector(".valid-feedback");
	if (valid)
		valid.remove();

	child.classList.add("is-valid");
	if (message !== null) {
		let feedback = document.createElement("div");
		feedback.classList.add("valid-feedback");
		feedback.innerText = message;
		parent.appendChild(feedback);
	}
}

function invalidFeedback(child, message) {
	let parent = child.parentElement;

	child.classList.remove("is-valid");
	child.classList.remove("is-invalid");
	let invalid = parent.querySelector(".invalid-feedback");
	if (invalid)
		invalid.remove();
	let valid = parent.querySelector(".valid-feedback");
	if (valid)
		valid.remove();

	child.classList.add("is-invalid");
	if (message !== null) {
		let feedback = document.createElement("div");
		feedback.classList.add("invalid-feedback");
		feedback.innerText = message;
		parent.appendChild(feedback);
	}
}

function clearFeedbacks(form) {
	let inputs = form.querySelectorAll("input");
	if (inputs === null)
		return;
	inputs.forEach(input => {
		input.classList.remove("is-invalid");
		input.classList.remove("is-valid");
		let parent = input.parentElement;
		let feedback = parent.querySelector(".invalid-feedback");
		if (feedback)
			feedback.remove();
		feedback = parent.querySelector(".valid-feedback");
		if (feedback)
			feedback.remove();
	});
}

function checkUsername(context, usernameId) {
	let username = document.querySelector(usernameId);
	if (username === null)
		return false;
	if (username.value.length < 3) {
		invalidFeedback(username, getLang(context, "errors.usernameTooShort"));
		return false;
	} else if (username.value.length > 24) {
		invalidFeedback(username, getLang(context, "errors.usernameTooLong"));
		return false;
	} else if (username.value.match(/[^a-zA-Z0-9_]/)) {
		invalidFeedback(username, getLang(context, "errors.usernameIllegal"));
		return false;
	}
	validFeedback(username, null);
	return true;
}

function checkFirstName(context, firstNameId) {
	let firstName = document.querySelector(firstNameId);
	if (firstName === null)
		return false;
	if (firstName.value.length < 1) {
		invalidFeedback(firstName, getLang(context, "errors.firstNameTooShort"));
		return false;
	} else if (firstName.value.length > 24) {
		invalidFeedback(firstName, getLang(context, "errors.firstNameTooLong"));
		return false;
	}
	validFeedback(firstName, null);
	return true;
}

function checkLastName(context, lastNameId) {
	let lastName = document.querySelector(lastNameId);
	if (lastName === null)
		return false;
	if (lastName.value.length < 1) {
		invalidFeedback(lastName, getLang(context, "errors.lastNameTooShort"));
		return false;
	} else if (lastName.value.length > 24) {
		invalidFeedback(lastName, getLang(context, "errors.lastNameTooLong"));
		return false;
	}
	validFeedback(lastName, null);
	return true;
}

function checkEmail(context, emailId) {
	let email = document.querySelector(emailId);
	if (email === null)
		return false;
	if (!email.value.match(/^([a-zA-Z0-9]+(\w*[a-zA-Z0-9])?([-.]([a-zA-Z0-9]\w*)?[a-zA-Z0-9])*)(@\w+)(\.\w+(\.\w+)?[a-zA-Z])$/)) {
		invalidFeedback(email, getLang(context, "errors.invalidEmail"));
		return false;
	}
	validFeedback(email, null);
	return true;
}

function checkPassword(context, passwordId) {
	let password = document.querySelector(passwordId);
	if (password === null)
		return false;
	if (password.value.length < 4) {
		invalidFeedback(password, getLang(context, "errors.passwordTooShort"));
		return false;
	}
	validFeedback(password, null);
	return true;
}

function checkPasswords(context, passwordId, confirmationId) {
	let password = document.querySelector(passwordId);
	let confirmation = document.querySelector(confirmationId);
	if (password === null || confirmation === null)
		return false;
	if (password.value !== confirmation.value) {
		invalidFeedback(confirmation, getLang(context, "errors.passwordMismatch"));
		return false;
	}
	validFeedback(confirmation, null);
	return true;
}

function checkUID(context, uidId) {
	let uid = document.querySelector(uidId);
	if (uid === null)
		return false;
	if (!uid.value.match(/^[a-z]{2}[A-Z0-9]{3}$/)) {
		invalidFeedback(uid, getLang(context, "errors.invalidUID"));
		return false;
	}
	validFeedback(uid, null);
	return true;
}

function checkA2F(context, a2fId, acceptEmpty = false) {
	let a2f = document.querySelector(a2fId);
	if (a2f === null)
		return acceptEmpty;
	if (!a2f.value.match(/^[0-9]{6}$/) && !(acceptEmpty && a2f.value === "")) {
		invalidFeedback(a2f, getLang(context, "errors.a2fBadLength"));
		return false;
	}
	validFeedback(a2f, null);
	return true;
}

export {
	getJson,
	postJson,
	validFeedback,
	invalidFeedback,
	clearFeedbacks,
	checkUsername,
	checkFirstName,
	checkLastName,
	checkEmail,
	checkPassword,
	checkPasswords,
	checkUID,
	checkA2F,
};
