IMAGE_NAME=pplenkov/agent-memory
TAG=latest

build:
	docker build --build-arg BUN_CONFIG_REGISTRY=$(BUN_CONFIG_REGISTRY) -t $(IMAGE_NAME):$(TAG) .

install: build
	docker extension install $(IMAGE_NAME):$(TAG)

update: build
	docker extension update $(IMAGE_NAME):$(TAG)

remove:
	docker extension rm $(IMAGE_NAME):$(TAG)

dev:
	cd ui && bun run dev &
	docker extension dev ui-source $(IMAGE_NAME):$(TAG) http://localhost:5173

debug:
	docker extension dev debug $(IMAGE_NAME):$(TAG)

validate:
	docker extension validate $(IMAGE_NAME):$(TAG)

.PHONY: build install update remove dev debug validate
