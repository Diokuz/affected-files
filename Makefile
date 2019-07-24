pretty:
	yarn prettier --write ./*.ts

prepare:
	yarn prettier --write ./*.ts
	yarn tsc
	yarn jest
