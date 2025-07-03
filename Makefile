commit:
	@if [ -z "$(m)" ]; then \
		echo "Error: Please provide a commit message with m=\"your message\""; \
		exit 1; \
	fi
	git add .
	git commit -am "$(m)"
	@if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} >/dev/null 2>&1; then \
		echo "No upstream branch found. Setting upstream and pushing..."; \
		git push --set-upstream origin $$(git rev-parse --abbrev-ref HEAD); \
	else \
		echo "Pushing to existing upstream..."; \
		git push; \
	fi

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
	cd docker && docker compose up -d

psql-stop:
	cd docker && docker compose down

.PHONY: psql-stop commit migrate prisma psql
