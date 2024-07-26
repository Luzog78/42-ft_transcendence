/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Konami.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:27 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:27 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { redirect } from "../script.js";


let konamiCode = [
	[ 'ArrowUp' ], [ 'ArrowUp' ],
	[ 'ArrowDown' ], [ 'ArrowDown' ],
	[ 'ArrowLeft' ], [ 'ArrowRight' ],
	[ 'ArrowLeft' ], [ 'ArrowRight' ],
	['b', 'B'], ['a', 'A']
];

let konamiCodePosition = 0;


function Konami(context) {
	let div = document.createElement("div");
	div.innerHTML = /*html*/`
		<div id="konami">
			<div class="k-dot"></div>
			<div class="k-dot"></div>
			<div class="k-dot"></div>
			<div class="k-dot"></div>
			<div class="k-dot"></div>
			<div class="k-dot"></div>
			<div class="k-dot"></div>
			<div class="k-dot"></div>
			<div class="k-dot"></div>
			<div class="k-dot"></div>
		</div>
	`;

	try {
		document.removeEventListener('keydown', konami);
	} catch (e) {
	}
	document.addEventListener('keydown', konami);

	return div;
}

function konami(e) {
	let dots = document.getElementsByClassName('k-dot');
	let key = e.key;

	if (!dots || !dots.length)
		return;

	if (konamiCode[konamiCodePosition].indexOf(key) !== -1) {
		dots[konamiCodePosition].style.translate = '0 -20vh';
		konamiCodePosition++;

		if (konamiCodePosition === konamiCode.length) {
			konamiCodePosition = 0;
			for (let i = 0; i < dots.length; i++) {
				dots[i].style.translate = null;
			}
			redirect("/local");
		}
	} else {
		konamiCodePosition = 0;
		for (let i = 0; i < dots.length; i++) {
			dots[i].style.translate = null;
		}
	}
}


export { Konami, konami };
