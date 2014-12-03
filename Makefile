
BEAUTIFY = js-beautify
COMPONENT = component
JSHINT = jshint
SERVE = serve

JS := $(shell find lib -name '*.js' -print)

PORT = 3000

build: components $(JS)
	@$(COMPONENT) build --dev

clean:
	rm -rf build components node_modules

components: component.json
	@$(COMPONENT) install --dev

install: node_modules
	@npm install -g component js-beautify jshint myth serve

beautify: $(JS)
	@$(BEAUTIFY) --replace $(JS)

lint: $(JS)
	@$(JSHINT) --verbose $(JS)

node_modules: package.json
	@npm install

server:
	@$(SERVE) --port $(PORT)

watch:
	watch $(MAKE) build

.PHONY: beautify build clean install lint release server watch
