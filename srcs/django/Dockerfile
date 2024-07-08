FROM debian:bookworm

RUN apt update -y
RUN apt install -y python3
RUN apt install -y python3-pip
RUN apt install -y python3-django
RUN apt install -y python3-daphne
RUN apt install -y python3-django-channels
RUN apt install -y python3-psycopg2
RUN apt install -y python3-pyotp
RUN apt install -y postgresql-client
RUN apt install -y htop
RUN apt install -y psmisc

EXPOSE 8000

RUN mkdir /ft_transcendence
WORKDIR /ft_transcendence

COPY workspace/ft_django/ /ft_transcendence/ft_django/
COPY workspace/api_app/ /ft_transcendence/api_app/
COPY workspace/game_app/ /ft_transcendence/game_app/
COPY workspace/manage.py /ft_transcendence/manage.py

COPY start.sh ./start.sh

# RUN echo "host pong pong_user 0.0.0.0/0 scram-sha-256" >> /etc/postgresql/15/main/pg_hba.conf

# COPY tool/init_db.sh /bin/init_db.sh

# RUN chmod +x /usr/bin/init_db.sh

# ENTRYPOINT ["/usr/bin/init_db.sh"]

CMD ["bash", "./start.sh"]
