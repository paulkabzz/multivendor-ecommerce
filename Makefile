commit:
	@if [ -z "$(m)" ]; then \
		echo "Error: Please provide a commit message with m=\"your message\""; \
		exit 1; \
	fi
	git add .
	git commit -am "$(m)"
	git push

flyway:
	cd database && \
	npm i && \
	npm run flyway migrate

prisma:
	cd api && \
	npm i && \
	npx prisma db pull && \
	npx prisma generate

docker:
	cd docker && docker-compose up -d

.PHONY: commit flyway prisma docker