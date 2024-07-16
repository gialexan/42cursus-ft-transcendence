# Use uma imagem base do Nginx com ModSecurity
FROM owasp/modsecurity-crs:nginx-alpine

USER root
RUN mkdir -p /etc/ssl/certs /etc/ssl/private

RUN openssl req -batch -x509 \
	-sha256 -nodes -newkey rsa:4096 -days 365 \
	-out /etc/ssl/certs/nginx-selfsigned.crt \
	-keyout /etc/ssl/private/nginx-selfsigned.key \
	-subj "/O=42sp/OU=42 Sao Paulo/CN=42sp.org.br"

# Copia os arquivos de configuração do Nginx e ModSecurity para o container
COPY ./nginx/proxy.conf /etc/nginx/conf.d/proxy.conf
COPY ./nginx/modsec/modsecurity.conf /etc/nginx/modsec/modsecurity.conf
COPY ./nginx/rules/rules.conf /etc/nginx/rules/rules.conf

# Copia os arquivos estáticos do frontend para o diretório do Nginx
COPY ./src /usr/share/nginx/html

# Define variáveis de ambiente, se necessário
ENV PROXY 1

# Exponha a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
