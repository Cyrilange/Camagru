COMPOSE_FILE    = docker-compose.yml
MKCERT_VERSION  = v1.4.4
MKCERT_BIN      = $(HOME)/.local/bin/mkcert
ARCH            := $(shell uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
MKCERT_URL      = https://github.com/FiloSottile/mkcert/releases/download/$(MKCERT_VERSION)/mkcert-$(MKCERT_VERSION)-linux-$(ARCH)

all: up

init:
	
	@mkdir -p $(HOME)/.local/bin
	@mkdir -p ./nginx/certs

$(MKCERT_BIN):
	@echo "[i] Downloading mkcert $(MKCERT_VERSION) for $(ARCH)..."
	@curl -sLo $(MKCERT_BIN) $(MKCERT_URL)
	@chmod +x $(MKCERT_BIN)

certs: init $(MKCERT_BIN)
	@echo "[i] Generating SSL certificates..."
	@CAROOT=$(HOME)/.local/share/mkcert \
		PATH="$(HOME)/.local/bin:$$PATH" \
		TRUST_STORES=nss \
		$(MKCERT_BIN) \
		-key-file ./nginx/certs/key.pem \
		-cert-file ./nginx/certs/cert.pem \
		localhost 127.0.0.1 \
	|| (echo "[!] mkcert failed"; exit 1)

up: certs
	@docker compose -f $(COMPOSE_FILE) up --build -d
	@HOST_IP=$$(hostname -I 2>/dev/null | awk '{print $$1}' || echo "localhost"); \
	URL="https://$$HOST_IP:8443"; \
	(cmd.exe /c start chrome --ignore-certificate-errors "$$URL" 2>/dev/null || \
	powershell.exe -Command "Start-Process 'chrome' '--ignore-certificate-errors $$URL'" 2>/dev/null || \
	google-chrome --ignore-certificate-errors "$$URL" 2>/dev/null || \
	chromium-browser --ignore-certificate-errors "$$URL" 2>/dev/null) & \
	echo ""; \
	echo "╔══════════════════════════════════════════╗"; \
	echo "║          Camagru is up!                  ║"; \
	echo "╠══════════════════════════════════════════╣"; \
	echo "║  Local:   https://localhost:8443         ║"; \
	printf "║  Network: https://%-22s║\n" "$$HOST_IP:8443"; \
	echo "╚══════════════════════════════════════════╝"; \
	echo ""

down:
	@docker compose -f $(COMPOSE_FILE) down

logs:
	@docker compose -f $(COMPOSE_FILE) logs -f

ps:
	@docker compose -f $(COMPOSE_FILE) ps

clean:
	@docker compose -f $(COMPOSE_FILE) down -v --remove-orphans
	@docker system prune -f

fclean: clean
	@docker volume rm $$(docker volume ls -q) 2>/dev/null || true
	@docker rmi -f $$(docker images -qa) 2>/dev/null || true
	@rm -rf $(HOME)/data/sqlite
	@rm -rf ./nginx/certs

re: fclean all

.PHONY: all init certs up down logs ps clean fclean re