function Persistants(context) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<div class="container-fluid" id="persistant-container"></div>
	`;
	let container = div.querySelector("#persistant-container");
	let i = 0;
	while (context.persistant.error.length > 0) {
		let error = context.persistant.error.shift();
		container.innerHTML += /*html*/`
			<div id="persistant-container-${i}" class="container alert alert-dismissible fade show container-blur-error" role="alert">
				<div class="content"></div>
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			</div>
		`;
		container.querySelector(`#persistant-container-${i} .content`).innerText = error;
		setTimeout((i) => {
			try {
				document.getElementById(`persistant-container-${i}`).remove();
			} catch (ignored) {
			}
		}, 4000 + 130 * i, i);
		i++;
	}
	while (context.persistant.success.length > 0) {
		let success = context.persistant.success.shift();
		container.innerHTML += /*html*/`
			<div id="persistant-container-${i}" class="container alert alert-dismissible fade show container-blur-success" role="alert">
				<div class="content"></div>
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			</div>
		`;
		container.querySelector(`#persistant-container-${i} .content`).innerText = success;
		setTimeout((i) => {
			try {
				document.getElementById(`persistant-container-${i}`).remove();
			} catch (ignored) {
			}
		}, 4000 + 130 * i, i);
		i++;
	}
	return div.outerHTML;
}

export { Persistants };
