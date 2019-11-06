to start up receiver-ap for testing. receiver-will be up and listening on port 8443. It will also bring other needed containers:
	make docker.compose.up

to stop the containers that were brought up:
	make docker.compose.down

to send data to receiver-ap:
	make producer
	or
	node src/ws-client.js --ws wss://localhost:8443 -i ./datasets/example.bin

to see the output on the receiver-ap:
	make docker.logs
	or
	docker logs -f receiver-ap_receiver-ap_1

to see the output of all the containers:
	docker-compose logs -f
	or
	make docker.compose.logs