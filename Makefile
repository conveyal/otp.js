build: install
	npm run build

clean:
	rm -rf client/build node_modules

install:
	@npm install

watch:
	npm run watch

.PHONY: build clean install watch
