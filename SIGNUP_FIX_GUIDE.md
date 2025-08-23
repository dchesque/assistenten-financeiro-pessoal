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

### 1. Teste via Console do Navegador (RECOMENDADO):
```javascript
// Abra o console (F12) na página /auth e execute:

// Teste rápido com email único
debugSupabaseAuth.quickTest()

// Ou teste com email específico:
debugSupabaseAuth.testSignUp('seu@email.com', 'SenhaForte123!', 'Seu Nome')

// Verificar configurações:
debugSupabaseAuth.checkSupabaseConfig()

// Ver usuários recentes:
debugSupabaseAuth.checkRecentUsers()
```

### 2. Teste via Interface:
```
1. Ir para /auth
2. Escolher "Criar conta"  
3. Preencher: Nome, email, senha forte (8+ chars, maiúsculas, números)
4. Abrir console (F12) ANTES de submeter
5. Clicar "Criar conta grátis"
6. Verificar logs detalhados no console
```

### 3. Verificar perfil criado (Supabase Dashboard):
```sql
-- SQL Editor no Supabase Dashboard
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;
```

## 🔍 Logs para Monitorar

### Console do Navegador (logs completos adicionados):
```
=== INÍCIO DO PROCESSO DE AUTENTICAÇÃO ===
🚀 Chamando signUpWithEmail...
✅ [AUTH] Signup realizado com sucesso. User ID: xxx-xxx-xxx
🔄 [AUTH] Trigger automático handle_new_user criará o perfil
✅ CADASTRO BEM-SUCEDIDO!
📧 Email de confirmação necessário
=== FIM DO PROCESSO DE AUTENTICAÇÃO ===
```

### Em caso de erro - MENSAGENS DETALHADAS:
```
❌ ERRO DETALHADO NO SIGNUP:
Mensagem: [mensagem específica]
Código: [código do erro]
Status: [status HTTP]
🔍 Tipo de erro: [classificação do erro]
```

## 🚨 Troubleshooting Completo

### 1. Erros Comuns e Soluções:

**❌ "User already registered"**
- **Causa**: Email já cadastrado
- **Solução**: Usar email diferente ou fazer login

**❌ "Invalid email"**  
- **Causa**: Formato de email inválido
- **Solução**: Verificar formato (user@domain.com)

**❌ "Weak password"**
- **Causa**: Senha não atende critérios
- **Solução**: Usar 8+ caracteres, maiúsculas, números

**❌ "Email not confirmed"**
- **Causa**: Email de confirmação não foi clicado
- **Solução**: Verificar email e pasta de spam

**❌ Erro 429 (Rate Limit)**
- **Causa**: Muitas tentativas em pouco tempo
- **Solução**: Aguardar 1-5 minutos

**❌ Network Error**
- **Causa**: Problema de conexão
- **Solução**: Verificar internet e URL do Supabase

### 2. Verificações no Supabase Dashboard:

**A. Authentication > Settings:**
```
✅ Enable email confirmations: ATIVADO
✅ Email domains: Permitir todos ou específicos
✅ Minimum password length: 6 ou mais
✅ SMTP configurado (se email custom)
```

**B. Authentication > Rate Limits:**
```
✅ Signup: 60 per hour (padrão)
✅ Login: 60 per hour (padrão)
✅ Não bloqueado por rate limit
```

**C. SQL Editor - Verificar trigger:**
```sql
-- Verificar se trigger existe
SELECT 
  schemaname, 
  tablename, 
  triggername, 
  definition 
FROM pg_triggers 
WHERE triggername = 'on_auth_user_created';

-- Verificar função handle_new_user
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';
```

**D. Logs > Auth:**
- Verificar tentativas de signup
- Verificar erros específicos
- Verificar triggers executados

### 3. Problemas de Trigger:

**Se perfil não está sendo criado:**
```sql
-- Recriar trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4. Verificações no Frontend:

**Console do navegador deve mostrar:**
```javascript
// SUCESSO esperado:
=== INÍCIO DO PROCESSO DE AUTENTICAÇÃO ===
✅ Todas as validações passaram para cadastro  
🚀 Chamando signUpWithEmail...
✅ [AUTH] Signup realizado com sucesso. User ID: abc-123
📧 Email de confirmação necessário

// ERRO esperado (com detalhes):
❌ ERRO DETALHADO NO SIGNUP:
Mensagem: User already registered
Código: 422
🔍 Tipo de erro: Email já cadastrado
```

### 5. Testes Avançados:

**No console do navegador:**
```javascript
// 1. Verificar configuração
debugSupabaseAuth.checkSupabaseConfig()

// 2. Teste completo
debugSupabaseAuth.quickTest()

// 3. Verificar usuários recentes  
debugSupabaseAuth.checkRecentUsers()

// 4. Teste manual específico
debugSupabaseAuth.testSignUp(
  'novoemail@teste.com', 
  'SenhaSegura123!', 
  'Nome do Usuario'
)
```

## 📝 Arquivos Modificados
- `src/hooks/useSupabaseAuth.ts` - Removido RPC duplicado, logs adicionados
- `src/pages/Auth.tsx` - Logs detalhados de debug no frontend
- `src/utils/debugSupabaseAuth.ts` - Ferramentas de teste via console
- `src/components/debug/SupabaseHealthCheck.tsx` - Componente de verificação
- `SIGNUP_FIX_GUIDE.md` - Documentação completa

## ✅ Status Completo
- [x] Problema diagnosticado (chamadas RPC duplicadas)
- [x] Código corrigido (confia no trigger automático)  
- [x] Logs detalhados adicionados (frontend + backend)
- [x] Ferramentas de teste criadas (console + componente)
- [x] Documentação completa (troubleshooting)
- [x] Múltiplos cenários de erro mapeados
- [ ] **PRONTO PARA TESTE**

## 🚀 Próximos Passos

**1. Testar imediatamente:**
```javascript
// No console do navegador em /auth:
debugSupabaseAuth.quickTest()
```

**2. Verificar resultados:**
- Console deve mostrar logs detalhados
- Identificar erro exato (se houver)
- Seguir troubleshooting específico

**3. Se ainda falhar:**
- Verificar configurações do Supabase Dashboard
- Executar queries SQL para verificar triggers
- Usar componente SupabaseHealthCheck

---
**Data da correção:** 23/08/2025  
**Responsável:** Claude Code Assistant  
**Status:** ✅ Debugging completo implementado