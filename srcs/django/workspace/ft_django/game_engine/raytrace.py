# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    raytrace.py                                        :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ycontre <ycontre@student.42.fr>            +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/07/18 16:27:26 by ycontre           #+#    #+#              #
#    Updated: 2024/07/23 16:37:43 by ycontre          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from .vector import Vector


class RayTrace():
	def __init__(self, pos: Vector, direction: Vector):
		self.pos = pos
		self.direction = direction

	def intersect(self, wall_point_1, wall_point_2):
		v1 = self.pos - wall_point_1
		v2 = wall_point_2 - wall_point_1
		v3 = Vector(-self.direction.y, self.direction.x)
		if v2.dot(v3) == 0:
			return None
		t1 = (v2.x * v1.y - v1.x * v2.y) / v2.dot(v3)
		t2 = v1.dot(v3) / v2.dot(v3)
		if t1 >= 0.0 and t2 >= 0.0 and t2 <= 1.0:
			return self.pos + self.direction * t1
		return None

	def intersects(self, walls) -> dict[str, Vector]:
		intersections: dict[str, Vector] = {}

		for wall_name in walls:
			wall = walls[wall_name]
			intersection = self.intersect(wall[0], wall[1])
			if intersection is not None:
				intersections[wall_name] = intersection

		intersections = dict(sorted(intersections.items(), key=lambda item: (item[1].distance(self.pos))))
		return intersections
