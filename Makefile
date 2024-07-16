all:
	docker-compose up --build -d

down:
	docker-compose down

clean:
	docker-compose down --rmi local --volumes --remove-orphans

fclean: clean
	docker system prune --all --force

re: clean all

shell:
	@read -p "=> Enter service: " service; \
	docker-compose exec -it $$service /bin/sh

logs:
	docker-compose logs

ps:
	docker-compose ps

# Vault
VAULT_CONTAINER_NAME := vault
ROOT_TOKEN := 00000000-0000-0000-0000-000000000000

setup-secrets:
	docker-compose exec $(VAULT_CONTAINER_NAME) vault login $(ROOT_TOKEN)
	docker-compose exec $(VAULT_CONTAINER_NAME) vault kv put secret/myapp username=admin password=supersecret

get-secrets:
	docker-compose exec $(VAULT_CONTAINER_NAME) vault login $(ROOT_TOKEN)
	docker-compose exec $(VAULT_CONTAINER_NAME) vault kv get secret/myapp

.PHONY: all down clean fclean shell logs ps init-vault unseal-vault setup-secrets get-secrets
