SHELL = /bin/bash

export NAMESPACE := hub.docker.hpecorp.net/iot-gateway
export PROJECT   := ws-receiver
export VERSION   := v0.1.0

export FQPN       := $(NAMESPACE)/$(PROJECT)
export BUILD_DATE ?= $(shell date +%Y%m%d%H%M%S)

all: docker.run

CERT_DIR=cert
CERT_FILE=$(PROJECT)-cert.pem
KEY_FILE=$(PROJECT)-key.pem

DOCKER_FILE    = Dockerfile
DOCKER_CONTEXT = .
DOCKER_TARGET  = target/docker

DOCKER_LAST_TAG = $(DOCKER_TARGET)/main.last.docker.tag
DOCKER_NEXT_TAG = $(DOCKER_TARGET)/main.$(BUILD_DATE).docker.tag

DOCKER_LAST_HASH = $(DOCKER_TARGET)/main.last.docker.hash
DOCKER_NEXT_HASH = $(DOCKER_TARGET)/main.$(BUILD_DATE).docker.hash

SRC_MAIN := src ../../common
SRC_TEST := test

MAIN_FILES := $(shell find $(SRC_MAIN) -name '*.*') package.json
CERT_FILES := $(shell find $(CERT_DIR) -name '*.pem')

SOURCES := $(MAIN_FILES) $(TEST_FILES) 
DOCKER_ALL_FILES = Dockerfile $(SOURCES) $(CERT_FILES)

DOCKER_NETWORK_NAME = raven

docker.build: $(DOCKER_LAST_TAG)

$(DOCKER_LAST_TAG): $(DOCKER_LAST_HASH)
	$(MAKE) $(DOCKER_NEXT_TAG)
	cp $(DOCKER_NEXT_TAG) $(@)

$(DOCKER_LAST_HASH): $(DOCKER_ALL_FILES)
	$(MAKE) $(DOCKER_NEXT_HASH)
	cp $(DOCKER_NEXT_HASH) $(@)

docker.network: $(DOCKER_LAST_TAG)
	docker network create $(DOCKER_NETWORK_NAME) --attachable || true

docker.run: $(DOCKER_LAST_TAG) docker.network
	docker run --network $(DOCKER_NETWORK_NAME) \
	--rm -it -p "5002:5002" --name $(PROJECT) \
	-e RECEIVER_PORT='5002' \
	-e DEBUG=$(PROJECT),config,receiver-ws,kafka \
	-e BROKER_HOST=10.50.8.13 \
	-e BROKER_PORT=1025 \
	$(shell cat $(DOCKER_LAST_TAG))

docker.release: $(DOCKER_LAST_TAG)
	docker tag $(shell cat $(DOCKER_LAST_TAG)) $(FQPN):$(VERSION)

pipe_fail = set -o pipefail;

%.docker.log:
	-mkdir -p $(@D)
	rm -fr $(@D)/common
	mkdir -p $(@D)/common
	cp -r ../../common $(@D)
	$(pipe_fail) docker build \
		--build-arg http_proxy=$(http_proxy) \
		--build-arg https_proxy=$(https_proxy) \
		--build-arg PROJECT=$(PROJECT) \
		-f $(DOCKER_FILE) $(DOCKER_CONTEXT) \
		| tee $(@)

%.docker.hash: %.docker.log
	$(pipe_fail) grep 'Successfully built' $(*).docker.log \
		| awk '{print $$3}' > $(@)

%.docker.tag: %.docker.hash
	docker tag $(shell cat $(*).docker.hash) \
		$(FQPN):snapshot-$(BUILD_DATE)
	docker tag $(shell cat $(*).docker.hash) \
		$(FQPN):latest
	@echo $(FQPN):snapshot-$(BUILD_DATE) > $(@)

docker.clean.tags:
	-find $(DOCKER_TARGET) -name '*.docker.tag' \
		| xargs -r cat \
		| sort | uniq \
		| xargs -t -l -r docker image rm
	-find $(DOCKER_TARGET) -name '*.docker.tag' \
		| xargs -t -l -r rm
	-docker image list \
		--format '$(FQPN):{{ .Tag }}' \
		$(FQPN):snapshot-* \
		| xargs -t -l -r docker image rm

oui:
	-mkdir -p target
	wget -O target/oui.txt http://standards-oui.ieee.org/oui/oui.txt 
	cat target/oui.txt | tr -d "\r" | grep -E '\(hex\)' | sort  > src/oui.json
	sed -i -r -f src/oui.sed src/oui.json

clean:
	rm -fr target

$(CERT_DIR):
	-mkdir -p $(CERT_DIR)

gencert: $(CERT_DIR)
	@if [ ! -e $(CERT_DIR)/$(CERT_FILE) ]; then openssl req -subj '/CN=localhost/O=Hewlett Packard Enterprise Company/OU=RnD Center-Brazil/C=BR/ST=Rio Grande do Sul/L=Porto Alegre/' -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout $(CERT_DIR)/$(KEY_FILE) -out $(CERT_DIR)/$(CERT_FILE); fi;

lint:
	node node_modules/eslint/bin/eslint.js src/** --fix
