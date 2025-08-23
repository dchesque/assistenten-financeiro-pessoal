# 🔍 INSTRUÇÕES COMPLETAS DE DEBUG PARA CADASTRO

## ⚡ TESTE IMEDIATO (MAIS RÁPIDO)

**1. Ir para a página /auth**
**2. Abrir Console do navegador (F12)**
**3. Executar um destes comandos:**

```javascript
// Teste super rápido (1 linha)
testSignUp()

// Teste com email específico
testSignUp('seu@email.com')

// Teste completo (múltiplos cenários)
debugSupabaseAuth.runAllTests()

// Teste direto sem hooks
debugSupabaseAuth.directSupabaseTest()
```

## 📊 LOGS ESPERADOS

### ✅ SUCESSO NORMAL:
```
=====================================
INICIANDO SIGNUP
Email: test_1692789123456@test.com
Password length: 11
=====================================
🔍 [AUTH] Verificando conexão com Supabase...
✅ [AUTH] Conexão Supabase OK, sessão atual: Nenhuma
📤 [AUTH] Dados enviados para signUp: {
  "email": "test_1692789123456@test.com",
  "password": "[HIDDEN]",
  "options": {
    "emailRedirectTo": "http://localhost:3000/auth/confirm",
    "data": {
      "name": "Quick Test",
      "email": "test_1692789123456@test.com"
    }
  }
}
🚀 [AUTH] Chamando supabase.auth.signUp...
supabase.auth.signUp: 1234ms
📥 [AUTH] RESPOSTA COMPLETA DO SUPABASE:
  Data: {user: {...}, session: null}
  Error: null
✅ ✅ ✅ SIGNUP BEM-SUCEDIDO ✅ ✅ ✅
  User ID: abc-123-xyz
  Email confirmado?: NÃO
  Precisa confirmar email?: SIM
=====================================
```

### ❌ ERRO - EMAIL JÁ CADASTRADO:
```
❌ ❌ ❌ ERRO DETALHADO DO SUPABASE ❌ ❌ ❌
  Message: User already registered
  Status: 422
  Code: email_address_already_exists
🔍 [AUTH] Tipo de erro identificado: Email já registrado
```

### ❌ ERRO - SENHA FRACA:
```
❌ ❌ ❌ ERRO DETALHADO DO SUPABASE ❌ ❌ ❌
  Message: Password should be at least 6 characters
  Status: 422
  Code: weak_password
🔍 [AUTH] Tipo de erro identificado: Senha fraca
```

### ❌ ERRO - CONEXÃO/REDE:
```
💥 EXCEÇÃO NO TESTE DIRETO:
TypeError: Failed to fetch
```

## 🔧 VERIFICAR CONFIGURAÇÃO

### 1. Logs da Configuração Supabase (aparecem automaticamente):
```
🔧 🔧 🔧 CONFIGURAÇÃO SUPABASE CLIENT 🔧 🔧 🔧
  Environment mode: development
  Has URL?: true
  URL completa: https://wrxosfdirgdlvfkzvcuh.supabase.co
  Has Key?: true
  Source: environment vars | hardcoded fallback
✅ Cliente Supabase criado com sucesso
📡 Teste de conexão: ✅ OK
```

### 2. Se aparece erro de configuração:
```
🚨 Configuração do Supabase inválida!
```
**Solução:** Verificar variáveis de ambiente .env

## 🧪 CENÁRIOS DE TESTE ESPECÍFICOS

### Teste 1: Email único (deve funcionar)
```javascript
testSignUp(`novo_${Date.now()}@teste.com`)
```

### Teste 2: Email já usado (deve dar erro)
```javascript
testSignUp('admin@example.com')
```

### Teste 3: Senha muito simples (pode dar erro)
```javascript
// No console:
const { supabase } = await import('/src/integrations/supabase/client');
const { data, error } = await supabase.auth.signUp({
  email: `test_${Date.now()}@test.com`,
  password: '123', // Senha muito simples
  options: { data: { name: 'Test' } }
});
console.log('Resultado:', { data, error });
```

### Teste 4: Formato de email inválido
```javascript
testSignUp('email-invalido')
```

## 🎯 IDENTIFICANDO O PROBLEMA EXATO

### Se não aparecem logs de configuração:
- **Problema:** Arquivo não está carregando
- **Solução:** Verificar se está na página /auth

### Se configuração OK mas signup falha:
- **Verificar:** Message do erro no console
- **Comum:** "User already registered", "weak_password"

### Se nem chega no Supabase:
- **Verificar:** Erros de rede no Network tab (F12)
- **Verificar:** Variáveis de ambiente VITE_SUPABASE_*

### Se signup funciona mas não cria perfil:
- **Verificar:** Logs de trigger no Supabase Dashboard
- **SQL:** `SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;`

## 🚨 PROBLEMAS CONHECIDOS E SOLUÇÕES

### 1. "User already registered"
- **Causa:** Email já usado
- **Solução:** Usar email diferente ou fazer login

### 2. "weak_password"
- **Causa:** Senha muito simples
- **Solução:** Usar senha com 8+ chars, maiúsculas, números

### 3. "Invalid email"
- **Causa:** Formato inválido
- **Solução:** Usar formato user@domain.com

### 4. Network Error / Failed to fetch
- **Causa:** Problema de conexão ou URL inválida
- **Solução:** Verificar URL no console de configuração

### 5. Rate Limit (429)
- **Causa:** Muitas tentativas
- **Solução:** Aguardar 5-10 minutos

### 6. Signup OK mas não redireciona
- **Causa:** Email precisa ser confirmado
- **Solução:** Verificar email ou configurar Supabase sem confirmação

## 🔗 PRÓXIMOS PASSOS APÓS IDENTIFICAR ERRO

1. **Email já cadastrado:** Implementar tela de login
2. **Senha fraca:** Ajustar validação do formulário  
3. **Rede/Config:** Verificar .env e Supabase Dashboard
4. **Rate limit:** Configurar rate limits no Supabase
5. **Perfil não criado:** Verificar trigger handle_new_user

---

**💡 DICA:** Manter console aberto durante todos os testes para capturar logs completos!