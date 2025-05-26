commit:
	@if [ -z "$(m)" ]; then \
		echo "Error: Please provide a commit message with m=\"your message\""; \
		exit 1; \
	fi
	git add .
	git commit -am "$(m)"
	git push

migrate:
	cd database && \
	npm i && \
	npm run flyway migrate

prisma:
	cd api && \
	npm i && \
	npx prisma db pull && \
	npx prisma generate

psql:
	cd docker && docker-compose up -d

docker-stop:
	cd docker && docker-compose down

.PHONY: docker-stop commit migrate prisma psql