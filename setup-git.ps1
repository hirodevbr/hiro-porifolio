# Script de configuração do Git para hiro-portfolio
# Execute este script após instalar o Git

Write-Host "=== Configuração do Git ===" -ForegroundColor Cyan

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Git não está instalado ou não está no PATH" -ForegroundColor Red
    Write-Host "Baixe e instale o Git de: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Configurar credenciais globais
Write-Host "`nConfigurando credenciais do Git..." -ForegroundColor Cyan
git config --global user.email "samuel.lol2019a@hotmail.com"
git config --global user.name "hirodevbr"

Write-Host "Email configurado: samuel.lol2019a@hotmail.com" -ForegroundColor Green
Write-Host "Username configurado: hirodevbr" -ForegroundColor Green

# Verificar se já existe repositório Git
if (Test-Path .git) {
    Write-Host "`nRepositório Git já existe!" -ForegroundColor Yellow
    git status
} else {
    Write-Host "`nInicializando repositório Git..." -ForegroundColor Cyan
    git init
    git branch -M main
    Write-Host "Repositório inicializado!" -ForegroundColor Green
}

# Adicionar arquivos
Write-Host "`nAdicionando arquivos ao staging..." -ForegroundColor Cyan
git add .

# Verificar status
Write-Host "`nStatus do repositório:" -ForegroundColor Cyan
git status

# Adicionar remote
Write-Host "`nConfigurando repositório remoto..." -ForegroundColor Cyan
$remoteExists = git remote get-url origin 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote 'origin' já existe!" -ForegroundColor Yellow
    git remote set-url origin https://github.com/hirodevbr/hiro-porifolio.git
} else {
    git remote add origin https://github.com/hirodevbr/hiro-porifolio.git
    Write-Host "Remote 'origin' adicionado!" -ForegroundColor Green
}

# Verificar remote
Write-Host "`nRepositórios remotos configurados:" -ForegroundColor Cyan
git remote -v

Write-Host "`n=== Configuração concluída! ===" -ForegroundColor Green
Write-Host "`nPróximos passos:" -ForegroundColor Yellow
Write-Host "1. Revise os arquivos com: git status" -ForegroundColor White
Write-Host "2. Faça o commit: git commit -m 'Initial commit: Portfolio completo'" -ForegroundColor White
Write-Host "3. Faça o push: git push -u origin main" -ForegroundColor White


