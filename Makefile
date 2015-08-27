
COMPONENT = node_modules/.bin/component
SERVE = serve

JS := $(shell find lib -name '*.js' -print)

PORT = 3000

build: components $(JS)
	@$(COMPONENT) build --dev --out client/build

clean:
	rm -rf build components node_modules

components: component.json
	@$(COMPONENT) install --dev

install: node_modules
	@npm install -g component myth serve

node_modules: package.json
	@npm install

server:
	@$(SERVE) client --port $(PORT)

watch:
	watch $(MAKE) build

.PHONY: build clean install server watch
