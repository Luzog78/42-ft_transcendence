FROM	debian:bookworm

RUN		apt-get update

RUN		apt-get install -y nginx

RUN		mkdir -p /etc/nginx/ssl

RUN		apt-get install -y openssl

RUN		openssl req -x509 -nodes -out /etc/nginx/ssl/localhost.crt \
		-keyout /etc/nginx/ssl/localhost.key \
		-subj "/C=FR/ST=CM/L=Angouleme/O=42/OU=42/CN=ysabik.42.fr/UID=ysabik"

RUN		mkdir -p /var/run/nginx

COPY	nginx.conf /etc/nginx/conf.d

RUN		chmod 755 /var/www/html	
RUN		chown -R www-data:www-data /var/www/html

EXPOSE	443

CMD		[ "nginx", "-g", "daemon off;" ]
