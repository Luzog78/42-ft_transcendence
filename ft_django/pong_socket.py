import json
import time
import math
import asyncio
import threading
from channels.generic.websocket import AsyncWebsocketConsumer

class Ball():
	def __init__(self, lobby, radius):
		self.lobby = lobby
		self.radius = radius

		self.pos = {"x": 0, "z": 0}
		self.vel = {"x": 0, "z": 0}
		self.acc = {"x": 0, "z": 0}

	@staticmethod
	def reflect(vector, normal):
		print(vector, normal)
		dot = vector['x'] * normal['x'] + vector['z'] * normal['y']
		scaled_normal = {'x': normal['x'] * 2 * dot, 'y': normal['y'] * 2 * dot}
		reflected_vector = {'x': vector['x'] - scaled_normal['x'], 'z': vector['z'] - scaled_normal['y']}
		return reflected_vector


	@staticmethod
	def closestPointOnSegment(A, B, P):
		AB = { "x": B["x"] - A["x"], "y": B["y"] - A["y"] };
		AP = { "x": P["x"] - A["x"], "y": P["z"] - A["y"] };
		AB_squared = AB["x"] * AB["x"] + AB["y"] * AB["y"];

		if (AB_squared == 0):
			return A

		t = (AP["x"] * AB["x"] + AP["y"] * AB["y"]) / AB_squared
		t = max(0, min(1, t))

		return { "x": A["x"] + t * AB["x"], "y": A["y"] + t * AB["y"] }

	@staticmethod
	def closestPointOnRectangle(rectangle, point):
		closestPoint = None
		minDistance = math.inf

		for i in range(len(rectangle)):
			j = (i + 1) % len(rectangle)
			segmentClosestPoint = Ball.closestPointOnSegment(rectangle[i], rectangle[j], point)
			distance = math.hypot(segmentClosestPoint["x"] - point["x"], segmentClosestPoint["y"] - point["z"])

			if (distance < minDistance):
				minDistance = distance
				closestPoint = segmentClosestPoint

		return ( closestPoint, minDistance )

	async def updateBall(self):
		await self.lobby.sendData("modify", {"scene.ball.sphere.position.x": self.pos["x"],
									   		"scene.ball.sphere.position.z": self.pos["z"]})
		await self.lobby.sendData("modify", {"scene.ball.vel.x": self.vel["x"],
									   		"scene.ball.vel.z": self.vel["z"]})
	
	def resolutionCollision(self, closestPoint, minDistance):
		collisionNormal = {
			"x": (self.pos["x"] - closestPoint["x"]) / minDistance,
			"y": (self.pos["z"] - closestPoint["y"]) / minDistance
		}

		penetrationDepth = self.radius - minDistance
		newCircleCenter = {
			"x": self.pos["x"] + penetrationDepth * collisionNormal["x"],
			"y": self.pos["z"] + penetrationDepth * collisionNormal["y"]
		}
		self.pos["x"] = newCircleCenter["x"]
		self.pos["z"] = newCircleCenter["y"]
		
		# //prevent going to fast curved ball
		# if (this.acc.length() > 0.5 && wallname.includes("wall"))
		# {
		# 	this.acc = new THREE.Vector3(0, 0, 0);
		# 	this.vel.setLength(this.currentVelLength - 0.25);
		# }
		self.vel = Ball.reflect(self.vel, collisionNormal)
		print(self.vel)
		# this.vel.setLength(this.vel.length() + 0.1);

		# this.effectCollision(scene, wallname, 
		# 	new THREE.Vector3(newCircleCenter.x, 0.25, newCircleCenter.y),
		# 	new THREE.Vector3(collisionNormal.x, 0, collisionNormal.y),);

		# this.currentVelLength = this.vel.length();

	async def update(self):
		self.pos["x"] += self.vel["x"] * self.lobby.gameServer.dt
		self.pos["z"] += self.vel["z"] * self.lobby.gameServer.dt

		self.vel["x"] += self.acc["x"] * self.lobby.gameServer.dt
		self.vel["z"] += self.acc["z"] * self.lobby.gameServer.dt

		for wall in self.lobby.walls:
			rectangle = self.lobby.walls[wall]
			sphere = self.pos

			closestPoint, minDistance = Ball.closestPointOnRectangle(rectangle, sphere)
			collision = minDistance <= self.radius

			
			if (collision): # to change
				self.resolutionCollision(closestPoint, minDistance)
				await self.updateBall()
	
		
class Lobby():
	def __init__(self, gameServer):
		self.gameServer = gameServer

		self.clients = []
		self.clientsPerLobby = 2

		self.ball = Ball(self, 0.15)
		self.walls = []

	async def update(self):
		await self.ball.update()

	def receive(self, data):
		if (data["walls"]):
			self.walls = data["walls"]

	async def addClient(self, client):
		self.clients.append(client)

		await client.sendData("modify", {"scene.server.lobby_id": len(self.gameServer.lobbys) - 1,
								   		"scene.server.client_id": len(self.clients) - 1})

		print("clients in lobby: ", len(self.clients))
		if (len(self.clients) == self.clientsPerLobby):
			for c in self.clients:
				self.ball.vel["x"] = 0.5
				self.ball.vel["z"] = 0.5
				await self.ball.updateBall()
				await c.sendData("game_status", "START")

	def removeClient(self, client):
		self.clients.remove(client)

	async def sendData(self, *args):
		for c in self.clients:
			await c.sendData(*args)

class GameServer():
	def __init__(self):
		self.lobbys = []
		self.clients = []

		self.tps = 20
		self.dt = 1 / self.tps

		self.gameServerThread = threading.Thread(target=asyncio.run, args=(self.update(),))
		self.gameServerThread.start()

	async def update(self):
		while True:
			time.sleep(self.dt)

			for lobby in self.lobbys:
				await lobby.update()
	
	def receive(self, data):
		lobby = gameServer.lobbys[data["lobby_id"]]
		lobby.receive(data)

		print("received ", json.dumps(data, indent=4))

	def lobbysAreFull(self):
		return len(self.lobbys) == 0 or len(self.lobbys[-1].clients) == self.lobbys[-1].clientsPerLobby

	async def addClient(self, client):
		self.clients.append(client)

		if (self.lobbysAreFull()):
			self.lobbys.append(Lobby(self))
		
		await self.lobbys[-1].addClient(client)

		
	def removeClient(self, client):
		self.clients.remove(client)

gameServer = GameServer()

class PongSocket(AsyncWebsocketConsumer):
	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.room_name = None
		self.room_group_name = None

	async def connect(self):
		self.room_name = 'pong'
		self.room_group_name = 'pong_group'
		
		await self.accept()
		await gameServer.addClient(self)

	async def disconnect(self, close_code):
		pass

	async def receive(self, text_data):
		data = json.loads(text_data)
		gameServer.receive(data)

	async def sendData(self, *args):

		data = {}
		for i in range(0, len(args), 2):
			key = args[i]
			value = args[i + 1]
			data[key] = value

		await self.sendJson(data)

	async def sendJson(self, json_data):
		await self.send(text_data=json.dumps(json_data))