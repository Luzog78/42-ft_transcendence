/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   TournamentManager.js                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: psalame <psalame@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/26 16:45:15 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/16 11:06:24 by psalame          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { refresh } from "../script.js";
import { NewTournament } from "./NewTournament.js";
import { Tournament } from "./Tournament.js";
import { TournamentList } from "./TournamentList.js";
import { Chat } from "../components/Chat.js";


async function TournamentManager(context, ...args) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<div id="tournament-content" class="block-blur">
			<div class="block-blur-pad"></div>
			<div class="container-fluid">
				<div class="text-center">⌛</div>
			</div>
			<div class="block-blur-pad"></div>
		</div>
	`;
	div.appendChild(Persistents(context), div.firstChild);
	div.appendChild(await NavBar("Tournament", context), div.firstChild);
	div.appendChild(Chat(context));

	let mainContainer = div.querySelector("#tournament-content .container-fluid");

	if (!mainContainer) {
		setTimeout(() => refresh(), 1000);
		return;
	}

	if (window.location.pathname === "/create")
		mainContainer.innerHTML = await NewTournament(context, ...args);
	else if (args.length == 0)
		mainContainer.innerHTML = await TournamentList(context, ...args);
	else
		mainContainer.innerHTML = await Tournament(context, ...args);

	return div;
}


export { TournamentManager };
