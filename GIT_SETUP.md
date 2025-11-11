# Configuração do Git para o projeto hiro-portfolio

## 1. Instalar Git (se ainda não tiver instalado)
Baixe e instale o Git de: https://git-scm.com/download/win

## 2. Configurar credenciais globais do Git
Execute os seguintes comandos no terminal:

```bash
git config --global user.email "samuel.lol2019a@hotmail.com"
git config --global user.name "hirodevbr"
```

## 3. Verificar se já existe um repositório Git
```bash
git status
```

## 4. Se NÃO existir repositório Git, inicialize:
```bash
git init
git branch -M main
```

## 5. Adicionar todos os arquivos ao staging
```bash
git add .
```

## 6. Criar arquivo .gitignore (se necessário)
Certifique-se de que existe um arquivo .gitignore com:
- node_modules/
- .next/
- .env.local
- .env*.local
- *.log
- .DS_Store

## 7. Fazer o primeiro commit
```bash
git commit -m "Initial commit: Portfolio completo com melhorias visuais"
```

## 8. Adicionar o repositório remoto
```bash
git remote add origin https://github.com/hirodevbr/hiro-porifolio.git
```

## 9. Verificar o remote
```bash
git remote -v
```

## 10. Fazer push para o GitHub
```bash
git push -u origin main
```

## Comandos úteis para o futuro:

### Ver status dos arquivos
```bash
git status
```

### Adicionar arquivos específicos
```bash
git add arquivo.tsx
```

### Fazer commit
```bash
git commit -m "Descrição das mudanças"
```

### Fazer push
```bash
git push
```

### Ver histórico de commits
```bash
git log --oneline
```


