FROM node:8-alpine

ARG PROJECT
ENV PROJECT ${PROJECT}

WORKDIR /usr/local/lib/${PROJECT}/raven/services/${PROJECT}

RUN apk add --no-cache \
        cyrus-sasl-dev \
        openssl-dev \
        zlib-dev \
        lz4-dev;

COPY package.json /usr/local/lib/${PROJECT}/raven/services/${PROJECT}/
COPY target/docker/common /usr/local/lib/${PROJECT}/raven/common/

RUN apk add --no-cache --virtual .build-deps \
        gcc \
        g++ \
        python \
        make \
        bash \
        libc-dev \
        bsd-compat-headers \
        py-setuptools \
        ca-certificates \
        musl-dev \
    && npm install --production --unsafe-perm --loglevel verbose \
    && apk del .build-deps

COPY src /usr/local/lib/${PROJECT}/raven/services/${PROJECT}/src/
COPY cert /usr/local/lib/${PROJECT}/raven/services/${PROJECT}/cert/

CMD [ "npm", "start" ]