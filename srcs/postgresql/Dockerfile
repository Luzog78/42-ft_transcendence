FROM debian:bookworm

RUN apt update -y && apt install -y postgresql

EXPOSE 3306

COPY tool/init_db.sh /bin/init_db.sh

RUN chmod +x /usr/bin/init_db.sh

ENTRYPOINT ["/usr/bin/init_db.sh"]

CMD ["sleep", "inf"]