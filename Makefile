# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: marvin <marvin@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/11 22:55:37 by ysabik            #+#    #+#              #
#    Updated: 2024/06/17 23:22:49 by marvin           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FILE_PATH="srcs/docker-compose.yml"

all: build up log

build:
	docker compose --file $(FILE_PATH) build --parallel

up:
	mkdir -p ~/sgoinfre/data-pong/postgresql
	docker compose --file $(FILE_PATH) up -d

down:
	docker compose --file $(FILE_PATH) down

log:
	docker compose --file $(FILE_PATH) logs -f

clean: down
	-docker stop $(docker ps -qa);
	-docker rm $(docker ps -qa);
	-docker rmi -f $(docker images -qa);
	-docker volume rm $(docker volume ls -q);
	-docker network rm $(docker network ls -q) 2>/dev/null

.PHONY: all build up down