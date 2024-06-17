# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/11 22:55:37 by ysabik            #+#    #+#              #
#    Updated: 2024/06/17 21:22:17 by ysabik           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

include			srcs/.env

COMPOSE_FILE	=	srcs/docker-compose.yml
MANAGE_FILE		=	manage.py


RESET			=	\033[0m
RED				=	\033[31m
GREEN			=	\033[32m
YELLOW			=	\033[33m
MAGENTA			=	\033[35m
DIM				=	\033[2m


# **************************************************************************** #


all:
	@$(MAKE) up
	@sleep 2
	@echo
	@$(MAKE) migrate
	@echo
	@$(MAKE) run

run:
	@echo "$(RED)$$> $(MAGENTA)python3 $(MANAGE_FILE) runserver$(RESET)"
	@python3 $(MANAGE_FILE) runserver

migrate:
	@echo "$(RED)$$> $(MAGENTA)python3 $(MANAGE_FILE) makemigrations$(RESET)"
	@python3 $(MANAGE_FILE) makemigrations
	@echo "$(RED)$$> $(MAGENTA)python3 $(MANAGE_FILE) migrate --run-syncdb$(RESET)"
	@python3 $(MANAGE_FILE) migrate --run-syncdb
	@echo "$(GREEN)[[ Migrations DONE ! ]]$(RESET)"

up:
	@mkdir -p ~/sgoinfre/data-pong/postgresql
	@echo "$(RED)$$> $(MAGENTA)docker compose -f $(COMPOSE_FILE) up -d --build$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)[[ Docker Compose UP ! ]]$(RESET)"

down:
	@echo "$(RED)$$> $(MAGENTA)docker compose -f $(COMPOSE_FILE) down$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)[[ Docker Compose DOWN ! ]]$(RESET)"

ps:
	@echo "$(RED)$$> $(MAGENTA)docker ps$(RESET)"
	@docker ps

images:
	@echo "$(RED)$$> $(MAGENTA)docker images$(RESET)"
	@docker images

volume:
	@echo "$(RED)$$> $(MAGENTA)docker volume ls$(RESET)"
	@docker volume ls

network:
	@echo "$(RED)$$> $(MAGENTA)docker network ls$(RESET)"
	@docker network ls

ls: ps images volume network

logs:
	@echo "$(RED)$$> $(MAGENTA)docker compose -f $(COMPOSE_FILE) logs -f$(RESET)"
	@docker compose -f $(COMPOSE_FILE) logs -f

console:
	docker exec -it postgresql bash

sql:
	docker exec -it postgresql bash -c "PGPASSWORD=$(DB_PASSWD) psql -h localhost -p 5432 -U $(DB_USER) $(DB_NAME)"

re: clean all

clean:
	$(call exec, docker stop $$(docker ps -qa), $$(docker ps -qa))
	$(call exec, docker rm $$(docker ps -qa), $$(docker ps -qa))
	$(call exec, docker rmi -f $$(docker images -qa), $$(docker images -qa))
	$(call exec, docker volume rm $$(docker volume ls -q), $$(docker volume ls -q))
	$(call exec, docker network rm $$(docker network ls | grep src | awk '{print $$1}'), $$(docker network ls | grep src | awk '{print $$1}'))

	@echo "$(GREEN)[[ Docker PURGED ! ]]$(RESET)"


define exec
	@if [ -n "$$(echo $(2) | awk '{$$1=$$1};1')" ]; then \
		echo "$(RED)$$> $(YELLOW)$$(echo -n $(1) | tr '\n' ' ')$(RESET)"; \
		$(1); \
		if [ $$? -eq 0 ]; then \
			echo "$(GREEN)OK$(RESET)"; \
		else \
			echo "$(RED)Error$(RESET)"; \
		fi; \
		echo; \
	fi;
endef


# **************************************************************************** #


.PHONY: all up down ps images volume network ls logs console sql run migrate re clean
