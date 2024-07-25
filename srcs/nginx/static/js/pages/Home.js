/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Home.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/11 22:56:11 by ysabik            #+#    #+#             */
/*   Updated: 2024/06/11 22:56:11 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { getLang, redirect } from "../script.js";
import { NavBar } from "../components/NavBar.js";
import { Persistents } from "../components/Persistents.js";
import { Chat } from "../components/Chat.js"


async function Home(context) {
	let div = document.createElement("div");
	div.innerHTML += /*html*/`
		<div id="home" class="full">

			<section id="intro" class="full">
				<h1>${getLang(context, "pages.home.intro")}</h1>
				<h1>ft_transcendence</h1>
			</section>

			<section class="half"></section>

			<section id="team">

				<h1>${getLang(context, "pages.home.teamTitle")}</h1>

				<div class="team-container">
					<div class="team-image">
						<img src="https://cdn.intra.42.fr/users/0850b4bd9f3ceedc934b34897841fd5c/ycontre.jpg" alt=" ">
					</div>
					<div class="team-desc">
						<h2>${getLang(context, "pages.home.yavinTitle")}</h2>
						<h3>${getLang(context, "pages.home.yavinSkills")} - ycontre</h3>
						<p>${getLang(context, "pages.home.yavinDesc")}</p>
					</div>
					<div class="line"></div>
				</div>

				<div class="team-container">
					<div class="team-image">
						<img src="https://cdn.intra.42.fr/users/1e1b56d76ccf0bf150018fcc40be8781/psalame.jpg" alt=" ">
					</div>
					<div class="team-desc">
						<h2>${getLang(context, "pages.home.paulTitle")}</h2>
						<h3>${getLang(context, "pages.home.paulSkills")} - psalame</h3>
						<p>${getLang(context, "pages.home.paulDesc")}</p>
					</div>
					<div class="line"></div>
				</div>

				<div class="team-container">
					<div class="team-image">
						<img src="https://cdn.intra.42.fr/users/1046eb06e67db02233dde6a9528d95bc/ysabik.jpg" alt=" ">
					</div>
					<div class="team-desc">
						<h2>${getLang(context, "pages.home.yanisTitle")}</h2>
						<h3>${getLang(context, "pages.home.yanisSkills")} - ysabik</h3>
						<p>${getLang(context, "pages.home.yanisDesc")}</p>
					</div>
					<div class="line"></div>
				</div>

			</section>

			<section class="half"></section>

			<section id="project">
				<h1>${getLang(context, "pages.home.projectTitle")}</h1>

				<div id="stats">

					<div class="stat">
						<div class="wrapper" style="--c: #88f">
							<img src="/static/img/code.svg" alt=" ">
							<div class="stat-border"></div>
							<div class="content">
								<h2>+18k</h2>
								<p>${getLang(context, "pages.home.statLinesOfCode")}</p>
							</div>
						</div>
					</div>

					<div class="stat">
						<div class="wrapper" style="--c: #f80">
							<img src="/static/img/calendar.svg" alt=" ">
							<div class="stat-border"></div>
							<div class="content">
								<h2>49 ${getLang(context, "pages.home.statDurationSymbol")}</h2>
								<p>${getLang(context, "pages.home.statDurationDesc")}</p>
							</div>
						</div>
					</div>

					<div class="stat">
						<div class="wrapper" style="--c: #8f8">
							<img src="/static/img/git.svg" alt=" ">
							<div class="stat-border"></div>
							<div class="content">
								<h2>286</h2>
								<p>${getLang(context, "pages.home.statCommits")}</p>
							</div>
						</div>
					</div>

				</div>

				<div id="techno">

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt=" ">
						<h3>Python</h3>
						<p>&gt;=3.10.1</p>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg" alt=" ">
						<h3>Django</h3>
						<p>4.2.11</p>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" alt=" ">
						<h3>HTML 5</h3>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" alt=" ">
						<h3>CSS 3</h3>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt=" ">
						<h3>Javascript</h3>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" alt=" ">
						<h3>PostgreSQL</h3>
						<p>latest (currently 16.3)</p>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg" alt=" ">
						<h3>NGinx</h3>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/debian/debian-original.svg" alt=" ">
						<h3>Debian</h3>
						<p>bookworm (12.5)</p>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" alt=" ">
						<h3>Docker</h3>
					</div>

					<div class="techno">
						<img src="https://getbootstrap.com/docs/5.3/assets/brand/bootstrap-logo-shadow.png" alt=" ">
						<h3>Bootstrap</h3>
						<p>5.3.3</p>
					</div>

					<div class="techno">
						<img src="https://global.discourse-cdn.com/standard17/uploads/threejs/original/2X/e/e4f86d2200d2d35c30f7b1494e96b9595ebc2751.png" alt=" ">
						<h3>Three JS</h3>
						<p>r166</p>
					</div>

					<div class="techno">
						<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" alt=" ">
						<h3>VS Code</h3>
						<p>June 2023 (1.91)</p>
					</div>

				</div>
			</section>

			<section class="half"></section>

			<section id="join">
				<h1>${getLang(context, "pages.home.joinTitle")}</h1>

				<button id="play" href="/play" data-link>
					<div id="play-left">${getLang(context, "pages.home.joinButton")}</div>
					<div class="line"></div>
					<div id="play-right">&gt;</div>
				</button>

				<span id="connect">
					<a href="/login" data-link>${getLang(context, "pages.home.joinLogin")}</a>
					<span>•</span>
					<a href="/register" data-link>${getLang(context, "pages.home.joinRegister")}</a>
				</span>
			</section>

			<section id="footer">

				<div id="see" class="footer-container">
					<h5>${getLang(context, "pages.home.footerTitle")}</h5>
				</div>

				<div class="line"></div>

				<div id="campus" class="footer-container">
					<h5>42 Angoulême</h5>
					<address>
						<p>51 Bd Besson Bey,</p>
						<p>16000 Angoulême</p>
					</address>
					<p><a href="https://42angouleme.fr/" target="_blank">https://42angouleme.fr/</a></p>
				</div>

				<div class="line"></div>

				<div id="links" class="footer-container">
					<h5>${getLang(context, "pages.home.footerLinks")}</h5>
					<div class="link-row">
						<a href="https://projects.intra.42.fr/projects/ft_transcendence" target="_blank">
							${getLang(context, "pages.home.footerLinksProject")}
						</a>
						<span>•</span>
						<a href="https://cdn.intra.42.fr/pdf/pdf/133398/en.subject.pdf" target="_blank">
							${getLang(context, "pages.home.footerLinksSubject")}
						</a>
					</div>
					<div class="link-row">
						<a href="https://profile.intra.42.fr/users/ycontre" target="_blank">Yavin</a>
						<span>•</span>
						<a href="https://profile.intra.42.fr/users/psalame" target="_blank">Paul</a>
						<span>•</span>
						<a href="https://profile.intra.42.fr/users/ysabik" target="_blank">Yanis</a>
					</div>
				</div>

				<div class="line"></div>

				<div id="bubbles" class="footer-container">
					<a class="bubble" href="https://github.com/Luzog78/42-ft_transcendence" target="_blank">
						<img src="https://raw.githubusercontent.com/ayogun/42-project-badges/main/badges/ft_transcendencem.png" alt=" ">
						<span>42-ft_transcendence</span>
					</a>
					<a class="bubble" href="https://github.com/TheRedShip" target="_blank">
						<img src="https://avatars.githubusercontent.com/u/42253239" alt=" "> <!-- https://github.com/TheRedShip.png -->
						<span>TheRedShip</span>
					</a>
					<a class="bubble" href="https://github.com/Poul0s" target="_blank">
						<img src="https://avatars.githubusercontent.com/u/43917783" alt=" "> <!-- https://github.com/Poul0s.png -->
						<span>Poul0s</span>
					</a>
					<a class="bubble" href="https://github.com/Luzog78" target="_blank">
						<img src="https://avatars.githubusercontent.com/u/63198599" alt=" "> <!-- https://github.com/Luzog78.png -->
						<span>Luzog78</span>
					</a>
				</div>

			</section>

		</div>
	`;
	div.insertBefore(await NavBar(getLang(context, "pages.home.title"), context), div.firstChild);
	div.insertBefore(Persistents(context), div.firstChild);
	div.appendChild(Chat(context));
	return div;
}


export { Home };
