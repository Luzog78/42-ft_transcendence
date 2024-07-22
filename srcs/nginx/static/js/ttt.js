/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ttt.js                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/16 13:40:35 by ysabik            #+#    #+#             */
/*   Updated: 2024/07/22 04:48:03 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { refresh } from "./script.js";
import { getJson, setupCopyKBDSpan } from "./utils.js";


function start() {

	const UID = window.location.pathname.split('/').pop();
	const user1Label = document.getElementById('user-1-name');
	const user2Label = document.getElementById('user-2-name');
	const game = document.getElementById('game');
	let interval = null;

	let slots = [
		document.getElementById('slot-1'),
		document.getElementById('slot-2'),
		document.getElementById('slot-3'),
		document.getElementById('slot-4'),
		document.getElementById('slot-5'),
		document.getElementById('slot-6'),
		document.getElementById('slot-7'),
		document.getElementById('slot-8'),
		document.getElementById('slot-9')
	];


	let intervalRunning = true;
	let gameRunning = false;
	let gameSlots = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	let user1Color, user1Shape;
	let user2Color, user2Shape;


	const gameUid = document.getElementById('game-uid');
	const gameIcon = document.getElementById('game-icon');
	setupCopyKBDSpan(UID, gameIcon, [ gameUid ]);


	function setPos(elem, slot) {
		let x = slot % 3;
		let y = Math.floor(slot / 3);

		let offX = x == 0 ? `calc(-1 * var(--gap))` : x == 2 ? `var(--gap)` : `0`;
		let offY = y == 0 ? `calc(-1 * var(--gap))` : y == 2 ? `var(--gap)` : `0`;

		elem.style.transform = `translate(${offX}, ${offY})`;
	}

	function createDiv(className, color = null) {
		let div = document.createElement('div');
		div.classList.add(className);
		if (color)
			div.classList.add(color);
		return div;
	}

	function createCircle(slot, color = null) {
		let circle = document.createElement('div');
		circle.classList.add('circle');
		if (color)
			circle.classList.add(color);
		setPos(circle, slot);
		game.appendChild(circle);
		return circle;
	}

	function createCross(slot, color = null) {
		let cross = document.createElement('div');
		cross.classList.add('cross');
		cross.appendChild(createDiv("cross-1", color));
		cross.appendChild(createDiv("cross-2", color));
		setPos(cross, slot);
		game.appendChild(cross);
		return cross;
	}

	function createTriangle(slot, color = null) {
		let triangle = document.createElement('div');
		triangle.classList.add('triangle');
		triangle.appendChild(createDiv("triangle-1", color));
		triangle.appendChild(createDiv("triangle-2", color));
		triangle.appendChild(createDiv("triangle-3", color));
		setPos(triangle, slot);
		game.appendChild(triangle);
		return triangle;
	}

	function createSquare(slot, color = null) {
		let square = document.createElement('div');
		square.classList.add('square');
		square.appendChild(createDiv("square-1", color));
		square.appendChild(createDiv("square-2", color));
		square.appendChild(createDiv("square-3", color));
		square.appendChild(createDiv("square-4", color));
		setPos(square, slot);
		game.appendChild(square);
		return square;
	}


	function startGame(data) {
		user1Label.innerText = data.user1;
		user2Label.innerText = data.user2;

		user1Label.classList.forEach(className => user1Label.classList.remove(className));
		user2Label.classList.forEach(className => user2Label.classList.remove(className));

		user1Label.classList.add('user-name', 'ucolor', data.user1Color);
		user2Label.classList.add('user-name', 'ucolor', data.user2Color);

		user1Color = data.user1Color;
		user1Shape = data.user1Shape;

		user2Color = data.user2Color;
		user2Shape = data.user2Shape;

		gameRunning = true;
	}


	function endGame(data) {
		gameRunning = false;
		intervalRunning = false;
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
		if (data.winner) {
			onReceive({ reset: true });
			gameSlots.forEach((elem, index) => onReceive({ slot: index, user: data.winner }));
			game.querySelectorAll('.line').forEach(l => {
				l.classList.forEach(c => l.classList.remove(c));
				l.classList.add('line', data.winner === 'user1' ? user1Color : user2Color);
			});
			setTimeout(() => refresh(), 3000);
		}
	}


	function sendToServer(slot = null) {
		let url = `/api/ttt/${UID}?`;
		if (slot !== null)
			url += `slot=${slot}&`;
		try {
			getJson(window.context, url.slice(0, -1)).then(data => {
				if (!data.ok) {
					console.log(data);
					return;
				}

				let lobby = data.lobby;
				if (lobby && !gameRunning && lobby.player1 && lobby.player2) {
					console.log('Game started!', lobby);
					onReceive({
						reset: true,
						start: true,
						user1: lobby.player1,
						user2: lobby.player2,
						user1Color: lobby.user1Color,
						user1Shape: lobby.user1Shape,
						user2Color: lobby.user2Color,
						user2Shape: lobby.user2Shape,
					});
				}

				if (lobby && lobby.board) {
					let board = lobby.board;
					let doReset = false;
					board.forEach((elem, index) => {
						if (elem == 0 && gameSlots[index] != 0)
							doReset = true;
					});
					if (doReset)
						onReceive({ reset: true });
					board.forEach((elem, index) => {
						if (gameSlots[index] !== elem) {
							onReceive({
								slot: index,
								user: elem === 1 ? 'user1' : 'user2'
							});
						}
					});
				}

				if (lobby && !gameRunning) {
					user1Label.innerText = lobby.player1 ? lobby.player1 : '. . . . . .';
					user2Label.innerText = lobby.player2 ? lobby.player2 : '. . . . . .';
				}

				onReceive(data);
			});
		} catch (ignored) {
			console.log(ignored);
		}
	}


	function onReceive(data) {
		if (data.reset !== undefined) {
			gameSlots = [0, 0, 0, 0, 0, 0, 0, 0, 0];

			game.querySelectorAll('.circle').forEach(elem => elem.remove());
			game.querySelectorAll('.cross').forEach(elem => elem.remove());
			game.querySelectorAll('.triangle').forEach(elem => elem.remove());
			game.querySelectorAll('.square').forEach(elem => elem.remove());
		}

		if (data.refresh !== undefined)
			setTimeout(() => refresh(), 100);

		if (data.start !== undefined)
			startGame(data);

		if (data.end !== undefined)
			endGame(data);

		if (data.slot !== undefined) {
			let user = data.user;
			let slot = data.slot;

			gameSlots[slot] = user === 'user1' ? 1 : 2;

			let shape = user === 'user1' ? user1Shape : user2Shape;
			let color = user === 'user1' ? user1Color : user2Color;

			if (shape === 'circle')
				createCircle(slot, color);
			else if (shape === 'cross')
				createCross(slot, color);
			else if (shape === 'triangle')
				createTriangle(slot, color);
			else if (shape === 'square')
				createSquare(slot, color);
		}
	}

	createCircle(0, 'red');
	createCross(1, 'blue');
	createTriangle(2, 'green');
	createSquare(3, 'yellow');
	createCircle(4, 'purple');
	createCross(5, 'aqua');
	createTriangle(6, 'red');
	createSquare(7, 'blue');
	createCircle(8, 'green');

	interval = setInterval(() => {
		if (!intervalRunning) {
			if (interval)
				clearInterval(interval);
			interval = null;
		}
		sendToServer();
	}, 1000);

	slots.forEach((slot, index) => slot.onclick = (e) => sendToServer(index));

	sendToServer();

	document.ttt = { sendToServer };


	console.log('TicTacToe loaded!');

}


export { start };
