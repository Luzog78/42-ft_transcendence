# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Vector.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: marvin <marvin@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/15 13:12:35 by marvin            #+#    #+#              #
#    Updated: 2024/06/15 13:12:35 by marvin           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import math


class Vector:
	def __init__(self, x, y, z):
		self.x = x
		self.y = y
		self.z = z

	def __add__(self, other):
		return Vector(self.x + other.x, self.y + other.y, self.z + other.z)

	def __sub__(self, other):
		return Vector(self.x - other.x, self.y - other.y, self.z - other.z)

	def __mul__(self, other):
		return Vector(self.x * other, self.y * other, self.z * other)

	def __truediv__(self, other):
		return Vector(self.x / other, self.y / other, self.z / other)

	def __str__(self):
		return f"({self.x}, {self.y}, {self.z})"

	def length(self):
		return (self.x ** 2 + self.y ** 2 + self.z ** 2) ** 0.5

	def setLength(self, length):
		currentLength = self.length()
		self.x *= length / currentLength
		self.y *= length / currentLength
		self.z *= length / currentLength

	def normalize(self):
		length = self.length()
		return Vector(self.x / length, self.y / length, self.z / length)

	def dot(self, other):
		return self.x * other.x + self.y * other.y + self.z * other.z

	def cross(self, other):
		return Vector(
			self.y * other.z - self.z * other.y,
			self.z * other.x - self.x * other.z,
			self.x * other.y - self.y * other.x
		)

	def angle(self, other):
		return math.acos(self.dot(other) / (self.length() * other.length()))

	def project(self, other):
		return other.normalize() * self.dot(other.normalize())

	def reflect(self, normal):
		return self - normal * 2 * self.dot(normal)

	def rotate(self, angle, axis):
		cos = math.cos(angle)
		sin = math.sin(angle)
		return self * cos + axis.cross(self) * sin + axis * axis.dot(self) * (1 - cos)

	def rotateAround(self, point, angle, axis):
		return (self - point).rotate(angle, axis) + point

	def distance(self, other):
		return (self - other).length()
