# Portfólio - Samuel de Jesus

Um portfólio moderno e responsivo desenvolvido com Next.js, TypeScript, Tailwind CSS e Framer Motion.

## 🚀 Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Framer Motion** - Animações suaves
- **Lucide React** - Ícones modernos
- **GitHub API** - Integração para exibir projetos
- **Vercel Analytics** - Analytics e monitoramento de performance
- **Google Analytics** - Tracking de eventos e comportamento do usuário

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd portifolio
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🎨 Funcionalidades

- ✨ Design moderno e responsivo
- 🎭 Animações suaves com Framer Motion
- 📱 Totalmente responsivo
- 🔗 Integração com GitHub API
- 💬 Integração com Discord (perfil e rich presence)
- 🌙 Tema escuro otimizado
- ⚡ Performance otimizada
- 🔍 SEO otimizado com Open Graph e Twitter Cards
- 🌐 Suporte a múltiplos idiomas (PT-BR / EN-US)
- 📱 PWA (Progressive Web App) - Instalável e funciona offline
- 🔄 Service Worker para cache e funcionamento offline
- 📊 Analytics integrado (Google Analytics e Vercel Analytics)
- 📈 Tracking de eventos customizado

## 📝 Personalização

### Alterar informações pessoais

Edite os componentes em `components/`:
- `Hero.tsx` - Seção principal
- `About.tsx` - Informações sobre você
- `Contact.tsx` - Informações de contato

### Alterar GitHub username

No arquivo `components/Projects.tsx`, altere o username:
```typescript
const data = await getGitHubRepos("seu-username");
```

### Configurar SEO e Meta Tags

O projeto já vem com SEO otimizado incluindo:

1. **Open Graph** - Para compartilhamento no Facebook, LinkedIn, etc.
2. **Twitter Cards** - Para compartilhamento no Twitter/X
3. **Sitemap.xml** - Gerado automaticamente em `/sitemap.xml`
4. **Robots.txt** - Gerado automaticamente em `/robots.txt`

**Para configurar:**

1. Edite `app/layout.tsx` e substitua `https://samuel-hiro.dev` pela sua URL real em:
   - `metadataBase`
   - `openGraph.url`
   - `twitter.images` (se necessário)

2. Edite `app/sitemap.ts` e `app/robots.ts` e substitua `https://samuel-hiro.dev` pela sua URL real.

3. **Criar imagem Open Graph (opcional mas recomendado):**
   - Crie uma imagem de 1200x630px
   - Salve como `public/og-image.png`
   - A imagem será usada automaticamente quando o site for compartilhado

4. **Adicionar verificação de propriedade (opcional):**
   - No `app/layout.tsx`, descomente e adicione seus códigos de verificação do Google Search Console, Yandex, etc.

### Alterar email de contato

No arquivo `components/Contact.tsx`, altere o email:
```typescript
href="mailto:hiro.communitydev@exemplo.com"
```

## 🎵 Pop-up de letra sincronizada (Spotify via Discord + LRCLIB)

O site usa a presença do Discord (Lanyard) para detectar o que está tocando no Spotify e mostra um pop-up com:
- Capa da música
- Letra sincronizada (LRCLIB)

Configuração: basta manter seu Discord com o Spotify conectado e o `DISCORD_USER_ID` configurado em `components/DiscordProfile.tsx`.

### Configurar Discord Profile

Para exibir seu perfil do Discord e rich presence:

1. **Encontre seu Discord User ID:**
   - Ative o Modo Desenvolvedor no Discord: Configurações > Avançado > Modo Desenvolvedor
   - Clique com botão direito no seu perfil > Copiar ID
   - Ou use: https://discord.id/

2. **Edite o arquivo `components/DiscordProfile.tsx`:**
```typescript
const DISCORD_USER_ID = "SEU_DISCORD_USER_ID_AQUI";
```

3. **Configure o Token do Discord (para banner, avatar e bio atualizados):**
   
   **Opção A - Bot Token (Recomendado):**
   - Acesse https://discord.com/developers/applications
   - Crie uma nova aplicação ou selecione uma existente
   - Vá em "Bot" e copie o token
   - Adicione no arquivo `.env.local`:
   ```bash
   DISCORD_BOT_TOKEN=seu_token_aqui
   ```
   
   **Opção B - User Token (Alternativa):**
   - Abra o Discord no navegador
   - Pressione F12 para abrir DevTools
   - Vá em Application > Local Storage > discord.com
   - Procure por "token" e copie o valor
   - Adicione no arquivo `.env.local`:
   ```bash
   DISCORD_USER_TOKEN=seu_token_aqui
   ```
   
   ⚠️ **ATENÇÃO:** 
   - Token de usuário expira e precisa ser renovado periodicamente
   - Bot token é mais estável e recomendado
   - NUNCA compartilhe seu token publicamente

4. **Para que a rich presence funcione, você precisa:**
   - Ter o Discord aberto
   - Ter "Atividade de Jogo" habilitada nas configurações do Discord
   - Estar em um servidor onde o bot Lanyard pode ver seu status (ou usar um servidor público)

## 📱 PWA (Progressive Web App)

O portfólio é um PWA completo com as seguintes funcionalidades:

### Funcionalidades PWA

- ✅ **Manifest.json** (`/site.webmanifest`) - Permite instalação como app nativo
- ✅ **Service Worker** (`/sw.js`) - Cache inteligente e funcionamento offline
- ✅ **Página Offline** (`/offline.html`) - Experiência personalizada quando sem conexão
- ✅ **Atualizações Automáticas** - Notificação quando nova versão está disponível

### Ícones Necessários

Para que o PWA funcione completamente, você precisa criar os seguintes ícones na pasta `public/`:

- `icon-72x72.png` (72x72px)
- `icon-96x96.png` (96x96px)
- `icon-128x128.png` (128x128px)
- `icon-144x144.png` (144x144px)
- `icon-152x152.png` (152x152px)
- `icon-192x192.png` (192x192px)
- `icon-384x384.png` (384x384px)
- `icon-512x512.png` (512x512px)
- `apple-touch-icon.png` (180x180px) - Para iOS

**Dica:** Você pode usar ferramentas online como:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

### Testando o PWA

1. **Chrome DevTools:**
   - Abra DevTools (F12)
   - Vá em "Application" > "Manifest"
   - Verifique se o manifest está carregado corretamente
   - Vá em "Service Workers" para ver o status do SW

2. **Lighthouse:**
   - Execute o Lighthouse no Chrome DevTools
   - Verifique a seção "Progressive Web App"
   - Deve passar em todos os critérios de PWA

3. **Instalação:**
   - No Chrome/Edge: Botão de instalação aparecerá na barra de endereços
   - No Android: Menu > "Adicionar à tela inicial"
   - No iOS: Compartilhar > "Adicionar à Tela de Início"

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente se necessário
4. Deploy automático!

### Outras plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- AWS Amplify
- Railway
- etc.

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

---

Desenvolvido com ❤️ por Samuel de Jesus



3. Para que a rich presence funcione, você precisa:
   - Ter o Discord aberto
   - Ter "Atividade de Jogo" habilitada nas configurações do Discord
   - Estar em um servidor onde o bot Lanyard pode ver seu status (ou usar um servidor público)

### Configurar Analytics

O projeto inclui integração com Google Analytics e Vercel Analytics para monitoramento de visitantes e eventos.

#### Google Analytics

1. Crie uma conta no [Google Analytics](https://analytics.google.com/)
2. Crie uma propriedade e obtenha seu Measurement ID (formato: `G-XXXXXXXXXX`)
3. Adicione a variável de ambiente no arquivo `.env.local`:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Vercel Analytics

O Vercel Analytics é automaticamente habilitado quando você faz deploy na Vercel. Não é necessária nenhuma configuração adicional.

#### Eventos Rastreados

O sistema rastreia automaticamente:
- ✅ Navegação entre seções
- ✅ Cliques em links sociais (GitHub, Instagram, Twitter)
- ✅ Visualização de projetos
- ✅ Cliques em projetos
- ✅ Envio de formulário de contato (sucesso/erro)
- ✅ Downloads de arquivos (quando aplicável)

#### Personalizar Tracking

Você pode adicionar tracking customizado usando as funções em `lib/analytics.ts`:

```typescript
import { trackEvent, trackProjectClick } from '@/lib/analytics';

// Evento customizado
trackEvent({
  action: 'custom_action',
  category: 'interaction',
  label: 'custom_label',
  value: 1
});
```

## 🚀 Deploy

### Vercel (Recomendado)

1. Faça push do código para o GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente se necessário
4. Deploy automático!

### Outras plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- AWS Amplify
- Railway
- etc.

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

---

Desenvolvido com ❤️ por Samuel de Jesus

