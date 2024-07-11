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
COPY workspace/manage.py /ft_transcendence/manage.py

COPY start.sh ./start.sh

CMD ["bash", "./start.sh"]
