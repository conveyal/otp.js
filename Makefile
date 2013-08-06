UGLIFY = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify

# the default rule when someone runs simply `make`
all: \
	dist/otp.js \
	dist/otp.standalone.js \
	dist/otp.uncompressed.js \
	dist/otp.standalone.uncompressed.js 

node_modules/.install: package.json
	npm install && touch node_modules/.install

otp%js:
	@cat $(filter %.js,$^) > $@

dist:
	mkdir -p dist

# assemble an uncompressed but complete library for development
dist/otp.uncompressed.js: node_modules/.install dist $(shell $(BROWSERIFY) --list index.js)
	$(BROWSERIFY) --debug index.js > $@

	# assemble an uncompressed but complete library for development
dist/otp.standalone.uncompressed.js: node_modules/.install dist $(shell $(BROWSERIFY) --list otp.js)
	$(BROWSERIFY) --debug otp.js > $@

# compress otp.js with [uglify-js](https://github.com/mishoo/UglifyJS),
# with name manging (m) and compression (c) enabled
dist/otp.js: dist/otp.uncompressed.js
	$(UGLIFY) $< -c -m -o $@

# compress otp.js with [uglify-js](https://github.com/mishoo/UglifyJS),
# with name manging (m) and compression (c) enabled
dist/otp.standalone.js: dist/otp.standalone.uncompressed.js
	$(UGLIFY) $< -c -m -o $@



clean:
	rm -rf dist/*
