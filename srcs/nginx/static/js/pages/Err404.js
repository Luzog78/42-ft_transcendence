/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Err404.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:06 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:06 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Konami } from "../components/Konami.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { getLang } from "../script.js";


async function Err404(context) {
	let div = document.createElement("div");

	div.innerHTML += /*html*/`
		<div style="position: fixed; top: 50%; transform: translateY(-50%); width: 100%; margin: auto">
			<div class="container-blur text-center">
				<h1 class="display-1" style="font-weight: 600;">${getLang(context, "pages.404.h0")}</h1>
				<br><br>
				<p>${getLang(context, "pages.404.p0")}</p>
				<p>
					${getLang(context, "pages.404.p1")}
					<a href="/">${getLang(context, "pages.404.p2")}</a>${getLang(context, "pages.404.p3")}
				</p>
			</div>
		</div>
	`;
	div.insertBefore(await NavBar(getLang(context, "pages.404.title"), context), div.firstChild);
	div.insertBefore(Persistents(context), div.firstChild);
	div.insertBefore(Konami(context), div.firstChild);

	return div;
}


export { Err404 };
