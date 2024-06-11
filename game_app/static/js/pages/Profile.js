/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Profile.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:22 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:22 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { persistError, redirect } from "../script.js";

function Profile(context, username) {
	if (!context.user.is_authenticated || !context.user.username) {
		persistError(context, "You must be logged in to access this page.");
		redirect("/login?next=" + window.location.pathname);
		return;
	} else if (!username) {
		redirect("/profile/" + context.user.username);
		return;
	}
	let div = document.createElement("div");
	div.innerHTML = NavBar("Profile", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div id="profile-content" class="block-blur">
			<div class="block-blur-pad"></div>
			<div class="container-fluid">

				<div class="profile">
					<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture">
					<span id="profile-name">Léopold LEMARCHAND</span>
					<sub id="profile-username">llemarch</sub>
				</div>

				<div class="rating">
					<span class="rating-label">Ratio :</span>
					<span class="rating-games">
						<span id="rating-games-won">15</span>
						<span>|</span>
						<span id="rating-games-lost">12</span>
					</span>
					<span id="rating-ratio">42.12%</span>
				</div>

				<table class="table table-striped" id="games-table">
					<thead>
						<tr>
							<th scope="col">Result</th>
							<th scope="col">Game link</th>
							<th scope="col">Date</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-lost">Lost</td>
							<td><a href="/play/1943">PONG #1943 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
					</tbody>
				</table>

				<div class="nav">
					<button type="button" class="btn btn-outline-primary nav-links">Previous</button>
					<span class="nav-labels">
						<span class="nav-label" id="nav-label-current">3</span>
						<span class="nav-label">/</span>
						<span class="nav-label" id="nav-label-total">17</span>
					</span>
					<button type="button" class="btn btn-outline-primary nav-links">Next</button>
				</div>

			</div>
			<div class="block-blur-pad"></div>
		</div>
	`;
	return div.outerHTML;
}

function CompleteProfileSample(context) {
	let div = document.createElement("div");
	div.innerHTML = NavBar("Profile Sample", context);
	div.innerHTML += Persistents(context);
	div.innerHTML += /*html*/`
		<p><br><br></p>
		<div id="profile-content" class="block-blur">
			<div class="block-blur-pad"></div>
			<div class="container-fluid">

				<div class="profile">
					<img id="profile-picture" src="/static/img/user.svg" alt="No profile picture">
					<span id="profile-name">Léopold LEMARCHAND</span>
					<sub id="profile-username">llemarch</sub>
				</div>

				<div class="rating">
					<span class="rating-label">Ratio :</span>
					<span class="rating-games">
						<span id="rating-games-won">15</span>
						<span>|</span>
						<span id="rating-games-lost">12</span>
					</span>
					<span id="rating-ratio">42.12%</span>
				</div>

				<table class="table table-striped" id="games-table">
					<thead>
						<tr>
							<th scope="col">Result</th>
							<th scope="col">Game link</th>
							<th scope="col">Date</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-lost">Lost</td>
							<td><a href="/play/1943">PONG #1943 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
						<tr>
							<td class="game-won">Win</td>
							<td><a href="/play/5813">PONG #5813 !</a></td>
							<td>10 days ago</td>
						</tr>
					</tbody>
				</table>

				<div class="nav">
					<button type="button" class="btn btn-outline-primary nav-links">Previous</button>
					<span class="nav-labels">
						<span class="nav-label" id="nav-label-current">3</span>
						<span class="nav-label">/</span>
						<span class="nav-label" id="nav-label-total">17</span>
					</span>
					<button type="button" class="btn btn-outline-primary nav-links">Next</button>
				</div>

			</div>
			<div class="block-blur-pad"></div>
		</div>
	`;
	return div.outerHTML;
}

export { Profile, CompleteProfileSample };
