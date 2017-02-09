FROM node:latest

RUN apt-get update \
    && apt-get install -qq libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

RUN mkdir -p /opt/node/js \
    && cd /opt/node

COPY ./package.json /opt/node/js/package.json

WORKDIR /opt/node/js

RUN cd /opt/node/js \
    && npm install

COPY ./public /opt/node/js/public
COPY ./index.js /opt/node/js/index.js

ENTRYPOINT ["node","index"]