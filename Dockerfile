FROM node:latest

RUN apt-get update \
    && apt-get install -qq libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

RUN mkdir -p /opt/node/js \
    && cd /opt/node

COPY ./package.json /opt/node/js/package.json

WORKDIR /opt/node/js

RUN cd /opt/node/js \
    && npm install

LABEL maintainer "arthur@violy.net"

EXPOSE 80

VOLUME /opt/node/js/images
VOLUME /opt/node/js/.cache

COPY ./public /opt/node/js/public
COPY ./index.js /opt/node/js/index.js
COPY ./server-config.json /opt/node/js/server-config.json

ENTRYPOINT ["node","index"]