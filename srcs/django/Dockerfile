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
RUN apt install -y openssl
RUN apt install -y libssl-dev
RUN apt install -y python3-werkzeug
RUN apt install -y python3-django-extensions
RUN apt install -y python3-openssl
RUN apt install -y htop
RUN apt install -y psmisc

EXPOSE 8000

RUN mkdir /ft_transcendence
WORKDIR /ft_transcendence

RUN mkdir -p /ft_transcendence/certs
RUN openssl req -x509 -nodes -out /ft_transcendence/certs/localhost.crt \
		-keyout /ft_transcendence/certs/localhost.key \
		-subj "/C=FR/ST=CM/L=Angouleme/O=42/OU=42/CN=ysabik.42.fr/UID=ysabik"

COPY workspace/ft_django/ /ft_transcendence/ft_django/
COPY workspace/api_app/ /ft_transcendence/api_app/
COPY workspace/game_app/ /ft_transcendence/game_app/
COPY workspace/manage.py /ft_transcendence/manage.py

COPY start.sh ./start.sh

CMD ["bash", "./start.sh"]
