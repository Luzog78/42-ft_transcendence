# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: ysabik <ysabik@student.42.fr>              +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/06/11 22:55:37 by ysabik            #+#    #+#              #
#    Updated: 2024/07/09 10:40:04 by ysabik           ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

include			srcs/.env

COMPOSE_FILE	=	srcs/docker-compose.yml
MANAGE_FILE		=	manage.py
PORT			=	8000


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
	@echo "$(RED)$$> $(MAGENTA)make $(GREEN)all       $(RESET):  $(MAGENTA)Make$(RESET) $(YELLOW)up$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)up        $(RESET):  Build & Up the containers$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)stop      $(RESET):  Stop the containers$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(GREEN)ls        $(RESET):  $(MAGENTA)Make$(RESET) $(YELLOW)ps$(RESET), $(YELLOW)images$(RESET), $(YELLOW)volume$(RESET), $(YELLOW)network$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)ps        $(RESET):  List all containers$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)images    $(RESET):  List all images$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)volume    $(RESET):  List all volumes$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)network   $(RESET):  List all networks$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)logs      $(RESET):  Show logs of the compose$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)dj        $(RESET):  Open a $(BOLD)bash console$(RESET) in the $(BOLD)django container$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)sql       $(RESET):  Open a $(BOLD)psql console$(RESET) in the $(BOLD)postgresql container$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)postgresql$(RESET):  Open a $(BOLD)bash console$(RESET) in the $(BOLD)postgresql container$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)nginx     $(RESET):  Open a $(BOLD)bash console$(RESET) in the $(BOLD)nginx container$(RESET) $(DIM)$(ITALIC)[Blocking]$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)run       $(RESET):  $(MAGENTA)Make$(RESET) $(YELLOW)kill$(RESET), Then run django server (with migrations)$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(YELLOW)kill      $(RESET):  Kill every python processes in the django container$(RESET)"
	@echo
	@echo "$(RED)$$> $(MAGENTA)make $(RED)re        $(RESET):  $(MAGENTA)Make$(RESET) $(YELLOW)clean$(RESET), $(YELLOW)all$(RESET)"
	@echo "$(RED)$$> $(MAGENTA)make $(RED)clean     $(RESET):  Stop & Remove all containers, images, volumes & networks$(RESET)"
	@echo


# **************************************************************************** #


all:
	@$(MAKE) --no-print-directory up


# **************************************************************************** #


up:
	@mkdir -p ~/sgoinfre/data-pong/postgresql
	@echo "$(RED)$$> $(MAGENTA)docker compose -f $(COMPOSE_FILE) up -d --build$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "$(GREEN)[[ Docker Compose UP ! ]]$(RESET)"


stop:
	@echo "$(RED)$$> $(MAGENTA)docker compose -f $(COMPOSE_FILE) stop$(RESET)"
	@docker compose -f $(COMPOSE_FILE) stop
	@echo "$(GREEN)[[ Docker Compose STOPPED ! ]]$(RESET)"


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


dj:
	@echo "$(RED)$$> $(MAGENTA)docker exec -it django bash$(RESET)"
	@docker exec -it django bash


sql:
	@echo "$(RED)$$> $(MAGENTA)docker exec -it postgresql bash -c \"PGPASSWORD=***** psql -h localhost -p $(DB_PORT) -U $(DB_USER) $(DB_NAME)\"$(RESET)"
	@docker exec -it postgresql bash -c "PGPASSWORD='$(DB_PASSWD)' psql -h localhost -p $(DB_PORT) -U $(DB_USER) $(DB_NAME)"


postgresql:
	@echo "$(RED)$$> $(MAGENTA)docker exec -it postgresql bash$(RESET)"
	@docker exec -it postgresql bash


nginx:
	@echo "$(RED)$$> $(MAGENTA)docker exec -it nginx bash$(RESET)"
	@docker exec -it nginx bash


# **************************************************************************** #


run:
	@-$(MAKE) --no-print-directory kill
	@echo
	@echo "$(RED)$$> $(MAGENTA)docker exec -it django python3 -u manage.py makemigrations$(RESET)"
	@docker exec -it django python3 -u manage.py makemigrations
	@echo
	@echo "$(RED)$$> $(MAGENTA)docker exec -it django python3 -u manage.py migrate --run-syncdb$(RESET)"
	@docker exec -it django python3 -u manage.py migrate --run-syncdb
	@echo
	@echo "$(RED)$$> $(MAGENTA)docker exec -itd django bash -c \"python3 -u manage.py runserver 0.0.0.0:$(PORT)\"$(RESET)"
	@docker exec -itd django bash -c "python3 -u manage.py runserver 0.0.0.0:$(PORT) 2>> /proc/1/fd/1 >> /proc/1/fd/1"
	@echo "$(GREEN)[[ Django RUNSERVER UP ! ]]$(RESET)"


kill:
	@echo "$(RED)$$> $(MAGENTA)docker exec -it django killall python3$(RESET)"
	@-docker exec -it django bash -c "killall python3 2>> /proc/1/fd/1"
	@echo "$(GREEN)[[ Python processes KILLED ! ]]$(RESET)"


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


.PHONY: help all up stop ls ps images volume network logs dj sql postgresql nginx run kill re clean
