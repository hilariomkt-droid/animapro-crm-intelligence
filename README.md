# AnimaPro CRM Intelligence

Repositório para o CRM AnimaPro v0.1 (Next.js + Supabase).

## Estado

Aguardando importação do código-fonte da versão 0.1 e configuração das variáveis de ambiente na Vercel. Este repositório ainda não contém uma aplicação pronta para publicação.

## Segurança

Não enviar `.env.local`, `SUPABASE_SERVICE_ROLE_KEY` ou outras credenciais ao GitHub.

## Implantação

1. Adicionar o código-fonte Next.js ao repositório.
2. Importar o repositório na Vercel.
3. Configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (somente servidor) e `NEXT_PUBLIC_APP_URL`.
4. Configurar URL e redirect de autenticação no Supabase.
5. Validar build, login, RLS, cadastro e funil antes de liberar a equipe.
