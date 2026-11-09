# AnimaPro CRM Intelligence v0.1

Projeto inicial real: Next.js App Router + Supabase Auth + PostgreSQL RLS. Interface em português.

## 1. Requisitos
Node.js 20+ e npm; projeto Supabase novo; conta Vercel ou Netlify (opcional para publicar).

## 2. Instalação local
```bash
npm install
cp .env.example .env.local
npm run dev
```
Preencha `.env.local` com a URL e a chave pública do Supabase. A chave `SUPABASE_SERVICE_ROLE_KEY` é **secreta e exclusiva do servidor**; jamais use prefixo NEXT_PUBLIC nela nem envie ao Git.

## 3. Banco de dados
No Supabase > SQL Editor, execute `supabase/schema.sql`. Em Authentication > Users, crie manualmente o primeiro administrador com e-mail e senha. Depois altere o e-mail em `supabase/bootstrap.sql` e execute-o **uma única vez**. Confirme que a inserção retornou uma linha.

## 4. Configurar autenticação
Em Authentication > URL Configuration, configure `Site URL` para `http://localhost:3000` em desenvolvimento e inclua `http://localhost:3000/auth/callback` nos Redirect URLs. Na produção inclua `https://SEU-DOMINIO/auth/callback` e ajuste `NEXT_PUBLIC_APP_URL`.

Convites: o administrador acessa **Equipe**, informa e-mail e perfil, e o servidor cria um convite no Supabase Auth. A associação à organização ocorre após a aceitação. Dependendo do template de e-mail do Supabase, personalize o link de convite para `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=invite` ou use o link padrão de confirmação com redirect configurado. Ao abrir o convite com `token_hash`, o usuário é direcionado à tela `/set-password` para criar sua senha. Confirme o comportamento do template de e-mail e do redirect no seu projeto Supabase.

## 5. Importação CSV
Aceita CSV com vírgulas ou ponto e vírgula e campos com aspas. Cabeçalhos reconhecidos: `nome`, `empresa`, `estabelecimento`, `segmento`, `cidade`, `whatsapp`, `email`, `instagram` (também aceita nomes em inglês). Não há deduplicação automática nesta versão; revise antes de importar. A listagem inicial está limitada aos 500 registros mais recentes e o seletor de clientes do funil aos primeiros 1000.

## 6. Publicar na Vercel
1. Envie esta pasta para um repositório privado GitHub.
2. Na Vercel, clique em Add New > Project, importe o repositório e use Next.js.
3. Configure as quatro variáveis do `.env.example` em Project Settings > Environment Variables, com `NEXT_PUBLIC_APP_URL` apontando para a URL pública.
4. Faça o deploy e adicione o callback da URL pública nas configurações de Auth do Supabase.
5. Teste login, inclusão de clientes, importação, negociações, convite e separação de permissões antes de uso real.

## 7. Publicar na Netlify
Importe o repositório em Add new project e deixe o framework Next.js ser detectado. Configure as mesmas variáveis, URL pública e redirects do Supabase. Utilize o runtime Next.js suportado pela plataforma; não publique como exportação estática, pois autenticação e convites exigem backend.

## 8. Segurança e limitações v0.1
- RLS limita acesso aos membros da organização; somente perfis comerciais autorizados inserem ou alteram clientes e negociações.
- Convites dependem da chave secreta de serviço no servidor.
- Ainda não há exclusão, edição de clientes, deduplicação, paginação completa, alertas automáticos, WhatsApp API, cobrança ou métricas sociais.
- O projeto não foi conectado a uma conta Supabase real. Teste localmente e configure monitoramento, backups e política LGPD antes de uso com dados reais.
- O primeiro administrador é criado por bootstrap SQL; não existe cadastro público de administrador.
