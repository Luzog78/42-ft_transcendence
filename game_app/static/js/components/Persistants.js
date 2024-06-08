function Persistants(context) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<div class="container-fluid" id="persistant-container"></div>
	`;
	let container = div.querySelector("#persistant-container");
	let i = 0;
	while (context.persistant.length > 0) {
		let persistant = context.persistant.shift();
		let className = persistant.ok ? "success" : "error";
		container.innerHTML += /*html*/`
			<div id="persistant-container-${i}" class="container alert alert-dismissible fade show container-blur-${className}" role="alert">
				<div class="content"></div>
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			</div>
		`;
		container.querySelector(`#persistant-container-${i} .content`).innerText = persistant.message;
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
