/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   LineEffects.js                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: marvin <marvin@student.42.fr>              +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/06/09 17:32:23 by marvin            #+#    #+#             */
/*   Updated: 2024/06/19 17:59:45 by marvin           ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Lines } from "./Lines.js"

class WallLines
{
	constructor(scene, points, colors, divisionCount, name="WallLine")
	{
		this.scene = scene;
		this.name = this.scene.getName(name);

		this.points = points;
		this.colors = colors;
		this.divisionCount = divisionCount;

		this.line = new Lines(scene, points, colors, divisionCount, 5, name);
		this.scene.entities.push(this.line)
	}

	destroy()
	{
		this.scene.remove(this.line);
	}

	update(scene)
	{
		this.line.mesh.position.y += 0.001;
		if (this.line.mesh.position.y >= -0.2)
			this.line.mesh.position.y = -1;
		// this.line.update(scene);
	}

}

export { WallLines }