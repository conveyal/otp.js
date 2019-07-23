
COMPONENT = node_modules/.bin/component
SERVE = serve

JS := $(shell find lib -name '*.js' -print)

PORT = 3000

replace_symlinks: build
	# Make a new client_no_symlinks directory, with symlinks replaced by
	# copies, so we can upload to a server.  Ed 2016-09-08
	rm -rf client_no_symlinks/
	mkdir -p client_no_symlinks/
	cp -a client/* client_no_symlinks/
	find client_no_symlinks/build -type l | (while read x; do l=$$(readlink $$x); rm $$x; cp -a $$l $$x; done)
	rm client_no_symlinks/config.js # so we don't overwrite server's version.

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
