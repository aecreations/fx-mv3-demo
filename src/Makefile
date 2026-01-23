# Makefile

EXT_VER=`./getver.py`
DIST_FILE=hellomv3-$(EXT_VER).zip
EXCLUDE=*~ *\.py Makefile


$(DIST_FILE):
	cp -v ../LICENSE.txt .
	zip -r $(DIST_FILE) * -x $(EXCLUDE)

clean:
	rm -fv $(DIST_FILE)
	rm -fv LICENSE.txt

# END Makefile
