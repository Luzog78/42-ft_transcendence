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


function postRaw(context, url, body, jsonify = true) {
	let promise = fetch(url, {
		method: "POST",
		headers: {
			"Authorization": "Bearer " + context.user.token,
		},
		body: body,
	});
	if (jsonify)
		promise = promise.then(res => res.json());
	return promise;
}

function postJson(context, url, data, jsonify = true, catches = true) {
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
	if (catches)
		promise = promise
			.catch(e => console.log("[❌] Error on POST.\n\n",
				"URL: ", url, "\n\nData: ", data, "\n\nError: ", e))
			.then(data => data ? data : {});
	return promise;
}

function getJson(context, url, catches = true) {
	let promise = fetch(url, {
		method: "GET",
		headers: {
			"Authorization": "Bearer " + context.user.token,
		},
	}).then(res => res.json());
	if (catches)
		promise = promise
			.catch(e => console.log("[❌] Error on GET.\n\n",
				"URL: ", url, "\n\nError: ", e))
			.then(data => data ? data : {});
	return promise
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

// function howLongAgo(date) {
// 	let now = new Date();
// 	let diff = now - date;
// 	if (diff < 60000)
// 		return "just now";
// 	if (diff < 3600000)
// 		return Math.floor(diff / 60000) + " minutes ago";
// 	if (diff < 86400000)
// 		return Math.floor(diff / 3600000) + " hours ago";
// 	if (diff < 604800000)
// 		return Math.floor(diff / 86400000) + " days ago";
// 	if (diff < 2592000000)
// 		return Math.floor(diff / 604800000) + " weeks ago";
// 	if (diff < 31536000000)
// 		return Math.floor(diff / 2592000000) + " months ago";
// 	return Math.floor(diff / 31536000000) + " years ago";
// }

class HowLongAgo {
	constructor(date) {
		this.date = date;
		this.now = new Date();
		this.diff = this.now - this.date;

		let diff = this.diff;
		this.d = Math.floor(diff / 86400000);
		diff -= this.d * 86400000;
		this.h = Math.floor(diff / 3600000);
		diff -= this.h * 3600000;
		this.m = Math.floor(diff / 60000);
		diff -= this.m * 60000;
		this.s = Math.floor(diff / 1000);
		diff -= this.s * 1000;
		this.ms = diff;
	}

	toString({ days = true, hours = true, minutes = true, seconds = true} = {}) {
		let d = 0;
		let h = 0;
		let m = 0;
		let s = 0;

		if (days) {
			d = Math.floor(diff / 86400000);
			diff -= d * 86400000;
		}
		if (hours) {
			h = Math.floor(diff / 3600000);
			diff -= h * 3600000;
		}
		if (minutes) {
			m = Math.floor(diff / 60000);
			diff -= m * 60000;
		}
		s = Math.floor(diff / 1000);

		let result = "";
		if (d > 0)
			result += d + "d ";
		if (h > 0)
			result += h + "h ";
		if (m > 0)
			result += m + "m ";
		if (result === "" && (!seconds || s <= 20))
			return "just now";
		if (seconds && s > 0)
			result += s + "s ";
		return result + "ago";
	}

	toFixedString(howManyFields = 2) {
		if (howManyFields === 0 || howManyFields > 4)
			return "...";

		let fields = [
			[this.d, "d "],
			[this.h, "h "],
			[this.m, "m "],
			[this.s, "s "],
		];
		let fieldsIdx = 0;
		for (let i = 0; i < fields.length; i++) {
			if (fields[i][0] > 0) {
				fieldsIdx = i;
				break;
			}
		}

		let result = "";
		for (let i = fieldsIdx; i < fieldsIdx + howManyFields && i < fields.length; i++) {
			if (i === 3 && result === "" && fields[i][0] <= 20)
				return "just now";
			if (fields[i][0] > 0)
				result += fields[i][0] + fields[i][1];
		}
		if (result === "")
			return "just now";
		return result + "ago";
	}

	toCustomString(func) {
		return this.toString(func(this));
	}
}

function toLocalDate(date) {
	return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

/**
 * Format a date to a string using the given format.
 *
 * @param {Date} date The date to format.
 * @param {string} format The format to use.
 *
 * @note The format can contain the following placeholders:
 *
 * ---
 *
 * - DD: Day with leading zero.
 * - MM: Month with leading zero.
 * - YYYY: Year.
 * - HH: Hours with leading zero.
 * - mm: Minutes with leading zero.
 * - ss: Seconds with leading zero.
 *
 * ---
 *
 * @returns {string} The formatted date.
 */
function toLocalDateStringFormat(date, format = "DD/MM/YYYY HH:mm:ss") {
	let localDate = toLocalDate(date);
	let day = localDate.getDate();
	let month = localDate.getMonth() + 1;
	let year = localDate.getFullYear();
	let hours = localDate.getHours();
	let minutes = localDate.getMinutes();
	let seconds = localDate.getSeconds();
	let result = format;
	result = result.replace("DD", day < 10 ? "0" + day : day);
	result = result.replace("MM", month < 10 ? "0" + month : month);
	result = result.replace("YYYY", year);
	result = result.replace("HH", hours < 10 ? "0" + hours : hours);
	result = result.replace("mm", minutes < 10 ? "0" + minutes : minutes);
	result = result.replace("ss", seconds < 10 ? "0" + seconds : seconds);
	return result;
}

function getGameMode(mode) {
	return mode === "TO" ? "Time Out"
			: mode === "FT" ? "First To"
			: mode === "BR" ? "Battle Royale"
			: `??? (${mode}) ???`;
}


function setupCopyKBDSpan(text, copySpan, spans = [],
							fromColor = "#0f03", toColor = "#0f00") {
	copySpan.innerHTML = "📋";
	copySpan.style.cursor = "pointer";
	spans.forEach(s => s.style.cursor = "pointer");

	function copy() {
		navigator.clipboard.writeText(text).then(() => {
			let signature = Math.random().toString(36).substring(2);
			copySpan.setAttribute("signature", signature);

			copySpan.innerHTML = "📋";
			copySpan.style.transition = "all 0s";
			copySpan.style.backgroundColor = null;
			spans.forEach(s => s.style.transition = "all 0s");
			spans.forEach(s => s.style.backgroundColor = null);
			setTimeout((signature) => {
				if (copySpan.getAttribute("signature") !== signature)
					return;
				copySpan.style.backgroundColor = fromColor;
				spans.forEach(s => s.style.backgroundColor = fromColor);
			}, 10, signature);
			setTimeout((signature) => {
				if (copySpan.getAttribute("signature") !== signature)
					return;
				copySpan.innerText = "✅";
				copySpan.style.transition = "all 1.9s";
				copySpan.style.backgroundColor = toColor;
				spans.forEach(s => s.style.transition = "all 1.9s");
				spans.forEach(s => s.style.backgroundColor = toColor);
			}, 80, signature);
			setTimeout((signature) => {
				if (copySpan.getAttribute("signature") !== signature)
					return;
				copySpan.innerHTML = "📋";
				copySpan.style.transition = null;
				copySpan.style.backgroundColor = null;
				spans.forEach(s => s.style.transition = null);
				spans.forEach(s => s.style.backgroundColor = null);
			}, 1920, signature);
		}).catch(err => {
			copySpan.innerHTML = "❌";
			console.error('[❌] Failed to copy: ', err);
		});
	}

	copySpan.onclick = () => copy();
	spans.forEach(s => s.onclick = () => copy());
}


export {
	getJson,
	postRaw,
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
	HowLongAgo,
	toLocalDate,
	toLocalDateStringFormat,
	getGameMode,
	setupCopyKBDSpan,
};
