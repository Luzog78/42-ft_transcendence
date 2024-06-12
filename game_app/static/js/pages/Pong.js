/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Pong.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:20 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:20 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { animate } from "../pong_game/main.js";

function Pong(context)
{
	console.log(context)
	let div = document.createElement("div");
	div.innerHTML = NavBar("Profile", context);
	div.innerHTML += Persistents(context);

	div.innerHTML += /*html*/`
		<style type="text/css">
			canvas {
				position: fixed;
				top: 0;
				z-index: -1;
			}
		</style>
	`;

	setTimeout(() => {
		animate();
	}, 250);

	// let script = document.createElement("script");

	// script.type = "module"
	// script.src = "static/js/pong_game/main.js";

	// document.body.appendChild(script);

	return div.outerHTML;
}

export { Pong }