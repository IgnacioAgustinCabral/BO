FROM ubuntu:latest

ENV DEBIAN_FRONTEND=noninteractive

RUN apt update && \
    echo "deb http://archive.ubuntu.com/ubuntu plucky main restricted universe multiverse" > /etc/apt/sources.list && \
    echo "deb http://archive.ubuntu.com/ubuntu plucky-updates main restricted universe multiverse" >> /etc/apt/sources.list && \
    apt update

RUN apt install -y -t plucky poppler-utils

RUN apt install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt install -y nodejs


WORKDIR /app

COPY . /app

RUN npm install

EXPOSE 4000

CMD ["node", "index.js"]
