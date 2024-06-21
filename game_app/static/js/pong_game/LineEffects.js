/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   LineEffects.js                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/09 17:32:23 by marvin            #+#    #+#             */
/*   Updated: 2024/06/21 16:28:12 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Lines } from "./Lines.js";


class WallLines
{
	constructor(scene, points, colors, division_count, name="WallLine", starting_height, ending_height)
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.points = points;
		this.colors = colors;
		this.division_count = division_count;

		this.starting_height = starting_height;
		this.ending_height = ending_height;

		this.line = new Lines(scene, points, colors, division_count, 5, name);
		// this.scene.entities.push(this.line)
	}

	destroy()
	{
		this.scene.remove(this.line);
	}

	update(scene)
	{
		this.line.mesh.position.y += 0.001;
		if (this.line.mesh.position.y >= this.ending_height)
			this.line.mesh.position.y = this.starting_height;
		// this.line.update(scene);
	}
}


export { WallLines };
