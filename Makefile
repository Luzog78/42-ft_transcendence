# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/11 22:55:37 by ysabik            #+#    #+#              #
#    Updated: 2024/06/21 03:16:26 by ysabik           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

include			srcs/.env

COMPOSE_FILE	=	srcs/docker-compose.yml
MANAGE_FILE		=	manage.py


RESET			=	\033[0m
BOLD			=	\033[1m
ITALIC			=	\033[3m
RED				=	\033[31m
GREEN			=	\033[32m
YELLOW			=	\033[33m
MAGENTA			=	\033[35m
DIM				=	\033[2m


# **************************************************************************** #


help:
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(GREEN)all     $(RESET):  $(MAGENTA)Make$(RESET) $(YELLOW)up$(RESET), $(YELLOW)migrate$(RESET), $(YELLOW)run$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)run     $(RESET):  Run the Django server$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)migrate $(RESET):  Make & Run migrations$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)up      $(RESET):  Build & Up the containers$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)down    $(RESET):  Down the containers$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(GREEN)ls      $(RESET):  $(MAGENTA)Make$(RESET) $(YELLOW)ps$(RESET), $(YELLOW)images$(RESET), $(YELLOW)volume$(RESET), $(YELLOW)network$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)ps      $(RESET):  List all containers$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)images  $(RESET):  List all images$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)volume  $(RESET):  List all volumes$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)network $(RESET):  List all networks$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)logs    $(RESET):  Show logs of the compose$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)sql     $(RESET):  Open a $(BOLD)psql console$(RESET) in the postgresql container$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)console $(RESET):  Open a $(BOLD)bash console$(RESET) in the postgresql container$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(RED)re      $(RESET):  $(MAGENTA)Make$(RESET) $(YELLOW)clean$(RESET), $(YELLOW)all$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(RED)clean   $(RESET):  Stop & Remove all containers, images, volumes & networks$(RESET)"
	@echo


# **************************************************************************** #


all:
	@$(MAKE) --no-print-directory up
	@sleep 2
	@echo
	@$(MAKE) --no-print-directory migrate
	@echo
	@$(MAKE) --no-print-directory run


# **************************************************************************** #


run:
	@echo "$(RED)$$> $(MAGENTA)python3 $(MANAGE_FILE) runserver$(RESET)"
	@python3 $(MANAGE_FILE) runserver


migrate:
	@echo "$(RED)$$> $(MAGENTA)python3 $(MANAGE_FILE) makemigrations$(RESET)"
	@python3 $(MANAGE_FILE) makemigrations
	@echo
	@echo "$(RED)$$> $(MAGENTA)python3 $(MANAGE_FILE) migrate --run-syncdb$(RESET)"
	@python3 $(MANAGE_FILE) migrate --run-syncdb
	@echo "$(GREEN)[[ Migrations DONE ! ]]$(RESET)"


# **************************************************************************** #


up:
	@mkdir -p ~/sgoinfre/data-pong/postgresql
	@echo "$(RED)$$> $(MAGENTA)docker compose -f $(COMPOSE_FILE) up -d --build$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)[[ Docker Compose UP ! ]]$(RESET)"


down:
	@echo "$(RED)$$> $(MAGENTA)docker compose -f $(COMPOSE_FILE) down$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down
	@echo "$(GREEN)[[ Docker Compose DOWN ! ]]$(RESET)"


# **************************************************************************** #


ls:
	@$(MAKE) --no-print-directory ps
	@echo
	@$(MAKE) --no-print-directory images
	@echo
	@$(MAKE) --no-print-directory volume
	@echo
	@$(MAKE) --no-print-directory network


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


# **************************************************************************** #


logs:
	@echo "$(RED)$$> $(MAGENTA)docker compose -f $(COMPOSE_FILE) logs -f$(RESET)"
	@docker compose -f $(COMPOSE_FILE) logs -f


sql:
	@echo "$(RED)$$> $(MAGENTA)docker exec -it postgresql bash -c \"PGPASSWORD=***** psql -h localhost -p 5432 -U $(DB_USER) $(DB_NAME)\"$(RESET)"
	@docker exec -it postgresql bash -c "PGPASSWORD=$(DB_PASSWD) psql -h localhost -p 5432 -U $(DB_USER) $(DB_NAME)"


console:
	@echo "$(RED)$$> $(MAGENTA)docker exec -it postgresql bash$(RESET)"
	@docker exec -it postgresql bash


# **************************************************************************** #


re:
	@$(MAKE) --no-print-directory clean
	@echo
	@$(MAKE) --no-print-directory all


clean:
	$(call exec, docker stop $$(docker ps -qa), $$(docker ps -qa))
	$(call exec, docker rm $$(docker ps -qa), $$(docker ps -qa))
	$(call exec, docker rmi -f $$(docker images -qa), $$(docker images -qa))
	$(call exec, docker volume rm $$(docker volume ls -q), $$(docker volume ls -q))
	$(call exec, docker network rm $$(docker network ls | grep src | awk '{print $$1}'), $$(docker network ls | grep src | awk '{print $$1}'))

	@echo "$(GREEN)[[ Docker PURGED ! ]]$(RESET)"


# **************************************************************************** #


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


.PHONY: help all run migrate up down ls ps images volume network logs sql console re clean
