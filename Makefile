FILE_PATH="srcs/docker-compose.yml"

all: build up

build:
	docker-compose --file $(FILE_PATH) build --parallel

up:
	mkdir -p ~/sgoinfre/data-pong/postgresql
	docker-compose --file $(FILE_PATH) up -d

down:
	docker-compose --file $(FILE_PATH) down

.PHONY: all build up down