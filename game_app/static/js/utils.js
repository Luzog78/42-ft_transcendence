function postJson(url, data, jsonify = true) {
	let promise = fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json; charset=utf-8",
		},
		body: JSON.stringify(data),
	});
	if (jsonify)
		promise = promise.then(res => res.json());
	return promise;
}

function getJson(url) {
	return fetch(url).then(res => res.json());
}

function validFeedback(child, message) {
	let parent = child.parentElement;

	child.classList.remove("is-invalid");
	let feedback = parent.querySelector(".invalid-feedback");
	if (feedback)
		feedback.remove();

	child.classList.add("is-valid");
	if (message !== null) {
		parent.innerHTML += /*html*/`
		<div class="valid-feedback"></div>
		`;
		parent.querySelector(".valid-feedback").innerText = message;
	}
}

function invalidFeedback(child, message) {
	let parent = child.parentElement;

	child.classList.remove("is-valid");
	let feedback = parent.querySelector(".valid-feedback");
	if (feedback)
		feedback.remove();

	child.classList.add("is-invalid");
	if (message !== null) {
		parent.innerHTML += /*html*/`
		<div class="invalid-feedback"></div>
		`;
		parent.querySelector(".invalid-feedback").innerText = message;
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

function checkUsername(usernameId) {
	let username = document.querySelector(usernameId);
	if (username === null)
		return false;
	if (username.value.length < 3) {
		invalidFeedback(username, "Username must be at least 3 characters long");
		return false;
	} else if (username.value.length > 24) {
		invalidFeedback(username, "Username must be at most 24 characters long");
		return false;
	} else if (username.value.match(/[^a-zA-Z0-9_]/)) {
		invalidFeedback(username, "Username must contain only letters, numbers and underscores");
		return false;
	}
	validFeedback(username, null);
	return true;
}

function checkFirstName(firstNameId) {
	let firstName = document.querySelector(firstNameId);
	if (firstName === null)
		return false;
	if (firstName.value.length < 1) {
		invalidFeedback(firstName, "First name must be at least 1 character long");
		return false;
	} else if (firstName.value.length > 24) {
		invalidFeedback(firstName, "First name must be at most 24 characters long");
		return false;
	}
	validFeedback(firstName, null);
	return true;
}

function checkLastName(lastNameId) {
	let lastName = document.querySelector(lastNameId);
	if (lastName === null)
		return false;
	if (lastName.value.length < 1) {
		invalidFeedback(lastName, "Last name must be at least 1 character long");
		return false;
	} else if (lastName.value.length > 24) {
		invalidFeedback(lastName, "Last name must be at most 24 characters long");
		return false;
	}
	validFeedback(lastName, null);
	return true;
}

function checkEmail(emailId) {
	let email = document.querySelector(emailId);
	if (email === null)
		return false;
	if (!email.value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
		invalidFeedback(email, "Invalid email address");
		return false;
	}
	validFeedback(email, null);
	return true;
}

function checkPassword(passwordId) {
	let password = document.querySelector(passwordId);
	if (password === null)
		return false;
	if (password.value.length < 4) {
		invalidFeedback(password, "Password must be at least 4 characters long");
		return false;
	}
	validFeedback(password, null);
	return true;
}

function checkPasswords(passwordId, confirmationId) {
	let password = document.querySelector(passwordId);
	let confirmation = document.querySelector(confirmationId);
	if (password === null || confirmation === null)
		return false;
	if (password.value !== confirmation.value) {
		invalidFeedback(confirmation, "Passwords do not match");
		return false;
	}
	validFeedback(confirmation, null);
	return true;
}

function checkUID(uidId) {
	let uid = document.querySelector(uidId);
	if (uid === null)
		return false;
	if (!uid.value.match(/^[0-9]+$/)) {
		invalidFeedback(uid, "Invalid UID (must be a number)");
		return false;
	}
	validFeedback(uid, null);
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
};
