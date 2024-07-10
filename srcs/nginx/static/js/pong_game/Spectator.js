/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Spectator.js                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/07/09 18:14:37 by ycontre           #+#    #+#             */
/*   Updated: 2024/07/10 09:40:55 by ysabik           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { initCamera } from "./map.js";


class Spectator
{
	constructor(scene)
	{
		this.scene = scene;

		this.keyboard = {};
		this.following_player = 0

		this.keydown_event_func = this.keydown_event.bind(this)
		this.keyup_event_func = this.keyup_event.bind(this)
	}

	isUp()
	{
		let keys = ["w", "ArrowLeft"];
		for (let key of keys)
		{
			if (this.keyboard[key])
				return (true)
		}
		return false
	}

	isDown()
	{
		let keys = ["s", "ArrowRight"];
		for (let key of keys)
		{
			if (this.keyboard[key])
				return (true)
		}
		return false
	}

	async keydown_event(e)
	{
		if (this.keyboard[e.key] == true)
			return;
		this.keyboard[e.key] = true;

		if (this.isUp())
			this.following_player--;
		else if (this.isDown())
			this.following_player++;
		if (this.following_player < 0)
			this.following_player = this.scene.player_num - 1;
		else if (this.following_player >= this.scene.player_num)
			this.following_player = 0;
	
		if (this.isDown() || this.isUp())
			initCamera(this.scene, this.scene.player_num, this.following_player)
		// await this.scene.server.sendData("player_keyboard", this.keyboard); // TODO
	}
	async keyup_event(e)
	{
		if (this.keyboard[e.key] == false)
			return;
		this.keyboard[e.key] = false;
		// await this.scene.server.sendData("player_keyboard", this.keyboard); // TODO
	}
}


export { Spectator };
