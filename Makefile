UGLIFY = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify

# make library
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

dist/otp.uncompressed.js: node_modules/.install dist $(shell $(BROWSERIFY) --list index.js)
	$(BROWSERIFY) --debug index.js > $@

dist/otp.standalone.uncompressed.js: node_modules/.install dist $(shell $(BROWSERIFY) --list otp.js)
	$(BROWSERIFY) --debug otp.js > $@

dist/otp.js: dist/otp.uncompressed.js
	$(UGLIFY) $< -c -m -o $@

dist/otp.standalone.js: dist/otp.standalone.uncompressed.js
	$(UGLIFY) $< -c -m -o $@



clean:
	rm -rf dist/*
