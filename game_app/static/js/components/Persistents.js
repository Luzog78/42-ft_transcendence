/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Persistents.js                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:29 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:29 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

var i = 0;

function Persistents(context) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<div class="container-fluid" id="persistent-container"></div>
	`;
	pushPersistents(context, div);
	return div.innerHTML;
}

function overridePersistents(context) {
	let container = document.querySelector("#persistent-container");
	if (container)
		container.outerHTML = Persistents(context);
}

function pushPersistents(context, dom=null) {
	let container = null;
	if (dom)
		container = dom.querySelector("#persistent-container");
	else
		container = document.querySelector("#persistent-container");
	let j = 0;
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
		setTimeout((i) => removePersistent(context, i), 4000 + 130 * j, i);
		i++;
		j++;
		if (i > 100000)
			i = 0;
	}
}


function removePersistent(context, id) {
	let container = document.getElementById(`persistent-container-${id}`);
	if (!container)
		return;

	let interval = setInterval(() => {
		let f = parseFloat(container.style.opacity);
		if (isNaN(f))
			f = 1;
		if (f <= 0) {
			container.remove()
			clearInterval(interval);
		}
		container.style.opacity = `${f - 0.015}`;
	}, 1);
}


export { Persistents, overridePersistents, pushPersistents };
