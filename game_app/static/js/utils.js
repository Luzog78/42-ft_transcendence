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

export { getJson, postJson };
