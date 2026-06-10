COMPOSE_FILE = docker-compose.yml

all: up

up:
	@docker compose -f $(COMPOSE_FILE) up --build -d 
	@echo ""
	@echo "Camagru is up!"
	@echo "Local: http://localhost"
	@echo ""

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

re: fclean all

seed:
	docker compose -f $(COMPOSE_FILE) exec backend node scripts/seed.js

.PHONY: all up down logs ps clean fclean re seed