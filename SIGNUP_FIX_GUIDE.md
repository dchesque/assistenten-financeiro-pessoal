# 🔧 Correção do Problema de Cadastro de Usuários

## 🔍 Problema Identificado
O sistema estava tentando criar perfis de usuários manualmente através de chamadas RPC (`upsert_profile` e `create_trial_subscription`), mas o banco de dados já possui um **trigger automático** `handle_new_user` que faz isso automaticamente quando um usuário é criado.

### Isso causava:
- ✅ Usuário criado no Supabase Auth
- ❌ Conflito nas chamadas RPC duplicadas
- ❌ Falha na criação de conta
- ❌ Usuário não consegue se cadastrar

## 🛠️ Solução Implementada

### 1. Removidas as chamadas RPC duplicadas:
- `supabase.rpc('upsert_profile')` 
- `supabase.rpc('create_trial_subscription')`

### 2. Simplificado o fluxo de cadastro:
- **signUpWithEmail**: Apenas chama `supabase.auth.signUp()`
- **signUpWithWhatsApp**: Apenas chama `supabase.auth.signUp()` 
- **verifyCode**: Apenas verifica o OTP

### 3. Confiança no trigger automático:
O trigger `handle_new_user` automaticamente:
- ✅ Cria perfil na tabela `profiles`
- ✅ Define role padrão como 'user'
- ✅ Cria trial subscription
- ✅ Define data de expiração do trial

### 4. Logs adicionados para debugging:
- 🚀 Início de cada operação
- ✅ Sucessos com detalhes
- ❌ Erros com contexto
- 🔄 Indicação de que trigger criará perfil

## 📋 Como Testar

### 1. Cadastro via Email:
```
1. Ir para /auth
2. Escolher "Criar conta"
3. Preencher email, senha e nome
4. Verificar no console: logs com 🚀, ✅ ou ❌
5. Usuário deve receber email de confirmação
6. Confirmar email e fazer login
```

### 2. Cadastro via WhatsApp:
```
1. Ir para /auth  
2. Escolher cadastro via WhatsApp
3. Inserir número e nome
4. Verificar logs no console
5. Receber e inserir código OTP
6. Login deve funcionar automaticamente
```

### 3. Verificar perfil criado:
```sql
-- No Supabase SQL Editor
SELECT * FROM profiles WHERE user_id = 'USER_ID_AQUI';
SELECT * FROM subscriptions WHERE user_id = 'USER_ID_AQUI';
```

## 🔍 Logs para Monitorar

### Console do Navegador:
- `🚀 [AUTH] Iniciando cadastro...`
- `✅ [AUTH] Signup realizado com sucesso`
- `🔄 [AUTH] Trigger automático handle_new_user criará o perfil`
- `✅ [AUTH] Perfil carregado com sucesso`

### Em caso de erro:
- `❌ [AUTH] Erro no signup:` + detalhes do erro
- `💥 [AUTH] Erro crítico:` + detalhes técnicos

## 🚨 Troubleshooting

### Se ainda não funcionar, verificar:

1. **Trigger ativo no banco:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. **Permissões do Supabase Auth:**
- Dashboard > Authentication > Settings
- "Enable email confirmations" deve estar ativo

3. **Rate limiting:**
- Supabase pode estar limitando tentativas
- Aguardar alguns minutos entre testes

4. **Logs do Supabase:**
- Dashboard > Logs > Auth Logs
- Verificar erros detalhados

## 📝 Arquivos Modificados
- `src/hooks/useSupabaseAuth.ts` - Principais correções
- `SIGNUP_FIX_GUIDE.md` - Esta documentação

## ✅ Status
- [x] Problema diagnosticado
- [x] Código corrigido
- [x] Logs adicionados
- [x] Documentação criada
- [ ] Teste completo em produção

---
**Data da correção:** ${new Date().toLocaleDateString('pt-BR')}
**Responsável:** Claude Code Assistant