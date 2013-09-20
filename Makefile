UGLIFY = node_modules/.bin/uglifyjs
BROWSERIFY = node_modules/.bin/browserify
BOWER = node_modules/bower/bin/bower

# make library
all: \
	dist/otp.js \
	dist/otp.standalone.js \
	dist/otp.uncompressed.js \
	dist/otp.standalone.uncompressed.js 

node_modules/.install: package.json
	npm install && touch node_modules/.install
	$(BOWER) install selectize
	
	# temporarily copy bower delivered static files to client (need to properly deAMDize and include view browserify)
	cp bower_components/selectize/dist/js/standalone/selectize.js client/
	cp bower_components/selectize/dist/css/selectize.default.css client/
	cp bower_components/selectize/dist/css/selectize.css client/

	# $(BROWSERIFY) -t deamdify bower_components/selectize/dist/js/selectize.js > lib/selectize.js

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
