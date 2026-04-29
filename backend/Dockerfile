FROM node:20-alpine

WORKDIR /app

# Copiar os arquivos de dependência
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar o resto do código
COPY . .

# Expor a porta do backend
EXPOSE 3000

# Iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]
