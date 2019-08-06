pretty:
	yarn prettier --write ./*.ts

prepare: jest
	yarn prettier --write ./src/*.ts
	yarn tsc

clean:
	rm -r lib || true

jest: clean
	yarn jest

tracked:
	git ls-files

untracked:
	git ls-files --others --exclude-standard
