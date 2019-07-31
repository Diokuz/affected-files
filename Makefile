pretty:
	yarn prettier --write ./*.ts

prepare: jest
	yarn prettier --write ./*.ts
	yarn tsc

clean:
	rm index.js || true
	rm index.d.ts || true
	rm options.js || true
	rm options.d.ts || true
	rm types.js || true
	rm types.d.ts || true

jest: clean
	yarn jest

tracked:
	git ls-files
