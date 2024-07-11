FROM	debian:bookworm

RUN		apt update
RUN		apt install -y nginx
RUN		apt install -y openssl

RUN		mkdir -p /etc/nginx/ssl
RUN		openssl req -x509 -nodes -out /etc/nginx/ssl/localhost.crt \
		-keyout /etc/nginx/ssl/localhost.key \
		-days 365000 \
		-subj "/C=FR/ST=CM/L=Angouleme/O=42/OU=42/CN=ysabik.42.fr/UID=ysabik"

RUN		mkdir -p /var/run/nginx
COPY	nginx.conf /etc/nginx/conf.d

RUN		mkdir -p /ft_transcendence
WORKDIR	/ft_transcendence

COPY	static /ft_transcendence/static
COPY	templates /ft_transcendence/templates

EXPOSE	4444

CMD		[ "nginx", "-g", "daemon off;" ]
