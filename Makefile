
COMPONENT = component
SERVE = serve
#localization
JSEXTRACT=../jsxgettext/lib/cli.js
PO2JSON=./node_modules/.bin/po2json
LOCALE_FOLDER=./lib/locale
TEMPLATE_FILE=$(LOCALE_FOLDER)/messages.pot
LANGS=sl fr de it ca_ES
JS_FILESPATH=./lib
JS_FILES = $(shell find $(JS_FILESPATH)/ -name '*.js')
HANDLEBAR_FILES = $(shell find $(JS_FILESPATH)/ -name '*.html')
LOCALE_FILES = $(shell find $(LOCALE_FOLDER)/ -name '*.po')

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

#Extracts new translation from JS files and creates PO template
extract: $(TEMPLATE_FILE)

$(TEMPLATE_FILE): $(JS_FILES) $(HANDLEBAR_FILES)
	#$(PYBABEL) extract --project=OpenTripPlanner -F $(BABEL_CFG) -s -k _tr -c TRANSLATORS: -o $(TEMPLATE_FILE) $(JS_FILESPATH)
	#$(JSEXTRACT) -c TRANSLATORS:  -L handlebars -k _ -o $(TEMPLATE_FILE) $(HANDLEBAR_FILES)
	#from handlebars
	jspot extract -k _ -t $(LOCALE_FOLDER) $(HANDLEBAR_FILES)
	#from javascript
	xgettext -cTRANSLATORS: -L JavaScript -o $(TEMPLATE_FILE) --from-code=UTF-8 -j  $(JS_FILES)

#Updates js files from new translations in po files
update_js: $(LOCALE_FILES)
	for LAN in $(LANGS); do $(PO2JSON) "$(LOCALE_FOLDER)/$$LAN.po" "$(JS_FILESPATH)/locale/$$LAN.json" --fuzzy -f jed1.x; done
	touch update_js

#Updates translations with new untraslated strings from template
update_po: $(LOCALE_FILES)

$(LOCALE_FILES): $(TEMPLATE_FILE)
	for LAN in $(LANGS); do msgmerge -U $(LOCALE_FOLDER)/"$$LAN.po" $(TEMPLATE_FILE) ; done

.PHONY: build clean install server watch extract update_js update_po
