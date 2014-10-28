COMPONENT := ./node_modules/.bin/component
JSHINT := ./node_modules/.bin/jshint
SERVE := ./node_modules/.bin/serve

JS := $(shell find lib -name '*.js' -print)

PORT = 3000

build: otp.js

clean:
	rm -rf build components node_modules

components: component.json
	$(COMPONENT) install --dev --debug

install: node_modules

# lint: $(JS)
# 	$(JSHINT) --debug $(JS)

node_modules: package.json
	npm install

release: otp.min.js

server:
	$(SERVE) --port $(PORT)

otp.js: components $(JS)
	$(MAKE) lint
	$(COMPONENT) build --dev --debug --out client/build
	$(COMPONENT) build --debug --standalone otp --out . --name otp

otp.min.js: otp.js
	$(COMPONENT) build --debug --use component-uglifyjs --standalone otp --out . --name otp.min  --prefix '.'

watch:
	watch $(MAKE) build

.PHONY: build clean install lint release server watch