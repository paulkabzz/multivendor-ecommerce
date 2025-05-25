commit:
	@if [ -z "$(m)" ]; then \
		echo "Error: Please provide a commit message with m=\"your message\""; \
		exit 1; \
	fi
	git add .
	git commit -am "$(m)"
	git push
