/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Logout.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:15 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:15 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getJson } from "../utils.js";
import { getLang, persistError, persistSuccess, popNext, redirect } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents, pushPersistents } from "../components/Persistents.js";

function Logout(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar(getLang(context, "pages.logout.title"), context);
	div.innerHTML += Persistents(context);
	getJson("/api/logout").then(data => {
		if (data.ok) {
			context.user = {
				isAuthenticated: false,
				username: null,
				createdAt: null,
				email: null,
				firstName: null,
				lastName: null,
				picture: null,
				lang: null,
				a2f: null,
				isAdmin: null,
				lastLogin: null,
			};
			persistSuccess(context, getLang(context, data.success));
			if (context.next)
				redirect(popNext(context));
		} else {
			persistError(context, getLang(context, data.error));
			pushPersistents(context);
		}
	});
	return div.innerHTML;
}

export { Logout };
