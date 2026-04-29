#!/bin/bash

echo "Iniciando o Backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "Iniciando o Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "========================================="
echo "Serviços rodando em segundo plano!"
echo "Para parar os serviços, feche este terminal ou pressione Ctrl+C"
echo "========================================="

# Aguarda os processos para que o terminal não feche imediatamente e possamos pará-los com Ctrl+C
wait $BACKEND_PID
wait $FRONTEND_PID
