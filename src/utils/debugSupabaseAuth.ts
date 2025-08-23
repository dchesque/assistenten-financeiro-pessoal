// Utilitários de debug para autenticação Supabase
import { supabase } from '@/integrations/supabase/client';

export const debugSupabaseAuth = {
  // Testar cadastro diretamente
  testSignUp: async (email: string, password: string, name: string = 'Teste Debug') => {
    console.log('🧪 === TESTE DIRETO DE CADASTRO ===');
    console.log('Email:', email);
    console.log('Nome:', name);
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      console.log('🚀 Chamando supabase.auth.signUp...');
      console.time('supabase.auth.signUp');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            name,
            email
          }
        }
      });
      
      console.timeEnd('supabase.auth.signUp');
      
      console.log('📊 RESULTADO COMPLETO:');
      console.log('Data:', data);
      console.log('Error:', error);
      console.log('User:', data?.user);
      console.log('Session:', data?.session);
      
      if (error) {
        console.error('❌ ERRO DETALHADO:');
        console.error('Message:', error.message);
        console.error('Status:', error.status);
        console.error('Code:', error.code);
        console.error('Details:', error);
        return { success: false, error };
      } else {
        console.log('✅ SUCESSO!');
        console.log('User ID:', data.user?.id);
        console.log('Email confirmado?', data.user?.email_confirmed_at ? 'Sim' : 'Não');
        console.log('Session ativa?', data.session ? 'Sim' : 'Não');
        return { success: true, data };
      }
    } catch (err: any) {
      console.error('💥 EXCEÇÃO NÃO TRATADA:');
      console.error('Tipo:', typeof err);
      console.error('Nome:', err.name);
      console.error('Mensagem:', err.message);
      console.error('Stack:', err.stack);
      return { success: false, exception: err };
    }
  },

  // Verificar configurações do cliente Supabase
  checkSupabaseConfig: () => {
    console.log('🔧 === CONFIGURAÇÕES DO SUPABASE ===');
    console.log('URL:', supabase.supabaseUrl);
    console.log('Key:', supabase.supabaseKey?.substring(0, 20) + '...');
    console.log('Auth:', supabase.auth);
    console.log('Realtime:', supabase.realtime);
    
    // Verificar se há sessão ativa
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Sessão ativa?', session ? 'Sim' : 'Não');
      if (session) {
        console.log('User ID:', session.user.id);
        console.log('Email:', session.user.email);
      }
      if (error) {
        console.error('Erro ao verificar sessão:', error);
      }
    });
  },

  // Verificar usuários criados recentemente
  checkRecentUsers: async () => {
    console.log('👥 === VERIFICANDO USUÁRIOS RECENTES ===');
    
    try {
      // Esta query pode falhar se não tiver permissões
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('❌ Erro ao buscar perfis:', error);
      } else {
        console.log('📋 Últimos 5 perfis criados:');
        console.table(data);
      }
    } catch (err) {
      console.error('💥 Exceção ao buscar perfis:', err);
    }
  },

  // Verificar triggers do banco
  checkTriggers: async () => {
    console.log('⚙️ === VERIFICANDO TRIGGERS ===');
    
    try {
      // Esta query pode falhar se não tiver permissões de admin
      const { data, error } = await supabase
        .rpc('check_auth_triggers'); // Função personalizada se existir
      
      if (error) {
        console.log('ℹ️ Não foi possível verificar triggers (normal para usuários não-admin)');
        console.log('Erro:', error.message);
      } else {
        console.log('📋 Triggers encontrados:', data);
      }
    } catch (err) {
      console.log('ℹ️ Verificação de triggers não disponível');
    }
  },

  // Teste com email único baseado em timestamp
  quickTest: async () => {
    const timestamp = Date.now();
    const testEmail = `test_${timestamp}@debug.local`;
    const testPassword = 'TesteDebug123!';
    const testName = 'Debug Test User';
    
    console.log('⚡ === TESTE RÁPIDO ===');
    console.log('Criando usuário:', testEmail);
    
    return await debugSupabaseAuth.testSignUp(testEmail, testPassword, testName);
  },

  // Teste direto com Supabase (sem hooks)
  directSupabaseTest: async () => {
    console.log('🧪 === TESTE DIRETO SUPABASE (SEM HOOKS) ===');
    
    const testEmail = `direct_${Date.now()}@test.com`;
    const testPassword = 'TesteDirecto123!';
    
    console.log('Email de teste:', testEmail);
    
    try {
      // Importar cliente Supabase diretamente
      const supabaseModule = await import('@/integrations/supabase/client');
      const supabase = supabaseModule.supabase;
      
      console.log('📡 Cliente Supabase importado');
      console.log('URL:', supabase.supabaseUrl);
      console.log('Key prefix:', supabase.supabaseKey?.substring(0, 20) + '...');
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            name: 'Teste Direto Console'
          }
        }
      });
      
      console.log('📊 RESULTADO DIRETO:');
      console.log('Data:', data);
      console.log('Error:', error);
      
      if (error) {
        console.error('❌ ERRO:', error);
        return { success: false, error };
      } else {
        console.log('✅ SUCESSO DIRETO!');
        return { success: true, data };
      }
      
    } catch (err) {
      console.error('💥 EXCEÇÃO NO TESTE DIRETO:', err);
      return { success: false, exception: err };
    }
  },

  // Executar todos os testes
  runAllTests: async () => {
    console.log('🚀 === EXECUTANDO TODOS OS TESTES ===');
    
    console.log('\n1. Verificando configuração...');
    debugSupabaseAuth.checkSupabaseConfig();
    
    console.log('\n2. Teste direto Supabase...');
    const directResult = await debugSupabaseAuth.directSupabaseTest();
    
    console.log('\n3. Teste via hook...');
    const hookResult = await debugSupabaseAuth.quickTest();
    
    console.log('\n4. Verificando usuários recentes...');
    await debugSupabaseAuth.checkRecentUsers();
    
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('Teste direto:', directResult.success ? '✅' : '❌');
    console.log('Teste via hook:', hookResult.success ? '✅' : '❌');
    
    return { directResult, hookResult };
  }
};

// Expor globalmente para uso no console do navegador
(window as any).debugSupabaseAuth = debugSupabaseAuth;

console.log('🔧 Debug tools carregados! Use debugSupabaseAuth no console.');
console.log('Comandos disponíveis:');
console.log('- debugSupabaseAuth.quickTest()');
console.log('- debugSupabaseAuth.directSupabaseTest()');
console.log('- debugSupabaseAuth.runAllTests()');
console.log('- debugSupabaseAuth.testSignUp(email, password, name)');
console.log('- debugSupabaseAuth.checkSupabaseConfig()');
console.log('- debugSupabaseAuth.checkRecentUsers()');
console.log('- debugSupabaseAuth.checkTriggers()');

// Criar função global de teste simples
(window as any).testSignUp = async (email?: string) => {
  const testEmail = email || `quick_${Date.now()}@test.com`;
  console.log(`🚀 Teste rápido com: ${testEmail}`);
  
  try {
    const module = await import('@/integrations/supabase/client');
    const { data, error } = await module.supabase.auth.signUp({
      email: testEmail,
      password: 'Teste123456',
      options: { data: { name: 'Quick Test' } }
    });
    
    console.log('Resultado:', { data, error });
    return { data, error };
  } catch (err) {
    console.error('Erro:', err);
    return { error: err };
  }
};

console.log('💡 Teste super rápido: testSignUp() ou testSignUp("seu@email.com")');