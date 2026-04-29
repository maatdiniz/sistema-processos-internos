@echo off
echo Iniciando o Backend...
start "Backend" cmd /k "cd backend && npm run dev"

echo Iniciando o Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo =========================================
echo Servicos rodando em novas janelas!
echo Para parar os servicos, basta fechar as janelas que foram abertas.
echo =========================================
