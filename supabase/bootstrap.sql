-- PASSO ÚNICO de inicialização, após criar seu usuário no painel Authentication > Users.
-- Substitua o e-mail pelo e-mail REAL do administrador e execute no SQL Editor.
with new_org as (insert into public.organizations(name) values ('AnimaPro Studio') returning id)
insert into public.memberships(organization_id,user_id,role)
select new_org.id,u.id,'admin' from new_org cross join auth.users u where lower(u.email)=lower('SEU_EMAIL@EXEMPLO.COM');
-- Se nenhuma linha for inserida, confirme que o usuário já existe no Auth.
