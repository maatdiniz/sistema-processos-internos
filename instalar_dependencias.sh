#!/bin/bash

echo "Instalando dependências do Backend..."
cd backend
npm install
cd ..

echo "Instalando dependências do Frontend..."
cd frontend
npm install
cd ..

echo "Dependências instaladas com sucesso!"
