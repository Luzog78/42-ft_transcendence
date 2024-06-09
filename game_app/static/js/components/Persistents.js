function Persistents(context) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<div class="container-fluid" id="persistent-container"></div>
	`;
	let container = div.querySelector("#persistent-container");
	let i = 0;
	while (context.persistent.length > 0) {
		let persistent = context.persistent.shift();
		let className = persistent.ok ? "success" : "error";
		container.innerHTML += /*html*/`
			<div id="persistent-container-${i}" class="container alert alert-dismissible fade show container-blur-${className}" role="alert">
				<div class="content"></div>
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			</div>
		`;
		container.querySelector(`#persistent-container-${i} .content`).innerText = persistent.message;
		setTimeout((i) => {
			try {
				document.getElementById(`persistent-container-${i}`).remove();
			} catch (ignored) {
			}
		}, 4000 + 130 * i, i);
		i++;
	}
	return div.outerHTML;
}

export { Persistents };
