/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   PlayWaiting.js                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/21 02:36:32 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/21 02:36:32 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { getLang } from "../script.js";


async function PlayWaiting(context, id, data=null) {
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.playId.title"), context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<div id="playid-content" class="container-fluid container-blur" style="padding: 50px; margin-top: 100px;">
		<div class="moving-point"></div>
			<div class="row">
			<div class="text-center search-text fs-1">
				<span
				>S</span><span
				>e</span><span
				>a</span><span
				>r</span><span
				>c</span><span
				>h</span><span
				>i</span><span
				>n</span><span
				>g</span>
			</div>
				<div class="row fs-3 justify-content-center">
					<p class="col-1">1</p>
					<p class="col-1">/</p>
					<p class="col-1">2</p>
				</div>
			</div>
		</div>
	`;
	return div.innerHTML;
}


export { PlayWaiting };
