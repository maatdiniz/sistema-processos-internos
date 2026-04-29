FROM node:20-alpine

WORKDIR /app

# Copiar os arquivos de dependência
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o resto do código
COPY . .

# Expor a porta do frontend (Vite)
EXPOSE 5173

# Iniciar o Vite expondo para a rede do Docker
CMD ["npm", "run", "dev", "--", "--host"]
