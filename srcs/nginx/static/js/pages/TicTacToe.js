/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   TicTacToe.js                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/18 10:20:36 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/22 02:33:19 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { getGameMode } from "../utils.js";
import { Chat } from "../components/Chat.js";
import { start } from "../ttt.js";


async function TicTacToe(context, uid, data) {
	let div = document.createElement("div");
	div.appendChild(await NavBar(getGameMode(data.mode), context), div.firstChild);
	div.appendChild(Persistents(context), div.firstChild);
	div.appendChild(Chat(context));

	div.innerHTML += /*html*/`
		<div id="body">
			<div class="kbd-span" id="game-kbd">
				<span class="pointer notSelectable" id="game-uid">#${uid}</span>
				<span class="pointer notSelectable" id="game-icon">⌛</span>
			</div>

			<div id="container">


				<div id="user-1" class="user">
					<div id="user-1-name" class="user-name ucolor red">. . . . . .</div>
				</div>


				<div id="game" class="container">
					<div id="line-1" class="line white"></div>
					<div id="line-2" class="line white"></div>
					<div id="line-3" class="line white"></div>
					<div id="line-4" class="line white"></div>

					<div id="slot-1" class="slot"></div>
					<div id="slot-2" class="slot"></div>
					<div id="slot-3" class="slot"></div>
					<div id="slot-4" class="slot"></div>
					<div id="slot-5" class="slot"></div>
					<div id="slot-6" class="slot"></div>
					<div id="slot-7" class="slot"></div>
					<div id="slot-8" class="slot"></div>
					<div id="slot-9" class="slot"></div>
				</div>

				<div id="user-2" class="user">
					<div id="user-2-name" class="user-name ucolor blue">. . . . . .</div>
				</div>

			</div>
			<link rel="stylesheet" href="/static/css/ttt.css">
		</div>
	`;
	setTimeout(() => start(), 200);
	return div;
}

function setOther(username, isPlayer1) {
	let elem = document.getElementById(isPlayer1 ? 'user-1' : 'user-2');
	if (elem)
		elem.innerText = username;
}


export { TicTacToe, setOther };
