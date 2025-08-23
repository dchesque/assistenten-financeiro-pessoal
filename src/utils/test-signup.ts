import { supabase } from '@/integrations/supabase/client';

export async function testSignup() {
  const randomNum = Math.floor(Math.random() * 999999);
  const testEmail = `test${randomNum}@test.com`;
  const testPhone = `11888${randomNum}`;
  
  console.log('=================================');
  console.log('TESTE DE SIGNUP - DEBUG COMPLETO');
  console.log('=================================');
  console.log('Email:', testEmail);
  console.log('Phone:', testPhone);
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Primeiro verificar conexão
    const { data: session } = await supabase.auth.getSession();
    console.log('Sessão atual:', session ? 'Existe' : 'Não existe');
    
    // Tentar signup
    console.log('Iniciando signup...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Test123456',
      options: {
        data: {
          name: 'Teste Frontend',
          phone: testPhone
        }
      }
    });
    
    if (error) {
      console.error('❌ ERRO DO SUPABASE AUTH:');
      console.error('- Message:', error.message);
      console.error('- Status:', error.status);
      console.error('- Name:', error.name);
      console.error('- Stack:', error.stack);
      
      // Verificar se usuário foi criado mesmo com erro
      console.log('\nVerificando se usuário foi criado no auth.users...');
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
          console.log('Não foi possível acessar auth.users (esperado no frontend)');
        } else {
          console.log('Usuários recentes:', authUsers);
        }
      } catch (adminErr) {
        console.log('Admin API não disponível no frontend (normal)');
      }
      
      // Verificar diretamente na tabela profiles
      console.log('\nVerificando profiles...');
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`phone.eq.${testPhone},name.eq.Teste Frontend`)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (profileError) {
        console.error('Erro ao buscar profiles:', profileError);
      } else {
        console.log('Profiles encontrados:', profiles);
      }
      
      return { error, data: null };
    }
    
    console.log('✅ SIGNUP SUCESSO!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Phone:', data.user?.phone);
    console.log('User metadata:', data.user?.user_metadata);
    console.log('Confirmação necessária?:', !data.session);
    
    // Verificar perfil criado
    if (data.user) {
      console.log('\nVerificando perfil criado...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();
        
      if (profileError) {
        console.error('❌ Erro ao buscar perfil:', profileError);
      } else if (profile) {
        console.log('✅ Perfil encontrado:', profile);
      } else {
        console.log('⚠️ Perfil não encontrado');
      }
    }
    
    return { error: null, data };
    
  } catch (err: any) {
    console.error('❌ ERRO NÃO CAPTURADO:', err);
    return { error: err, data: null };
  } finally {
    console.log('=================================');
    console.log('FIM DO TESTE');
    console.log('=================================');
  }
}

// Função para testar múltiplos cenários
export async function testSignupScenarios() {
  console.log('🧪 INICIANDO TESTE DE MÚLTIPLOS CENÁRIOS');
  
  // Cenário 1: Email único
  console.log('\n--- CENÁRIO 1: Email único ---');
  await testSignup();
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2s
  
  // Cenário 2: Email duplicado
  console.log('\n--- CENÁRIO 2: Email duplicado ---');
  const duplicateEmail = 'test@duplicate.com';
  
  try {
    // Primeiro signup
    const { error: firstError } = await supabase.auth.signUp({
      email: duplicateEmail,
      password: 'Test123456',
      options: {
        data: {
          name: 'Primeiro Teste',
          phone: '11999999991'
        }
      }
    });
    
    console.log('Primeiro signup:', firstError ? 'ERRO' : 'SUCESSO');
    if (firstError) console.log('Erro primeiro:', firstError.message);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Segundo signup (deve dar erro)
    const { error: secondError } = await supabase.auth.signUp({
      email: duplicateEmail,
      password: 'Test123456',
      options: {
        data: {
          name: 'Segundo Teste',
          phone: '11999999992'
        }
      }
    });
    
    console.log('Segundo signup:', secondError ? 'ERRO (esperado)' : 'SUCESSO (inesperado)');
    if (secondError) console.log('Erro segundo:', secondError.message);
    
  } catch (err: any) {
    console.error('Erro no teste de duplicação:', err);
  }
  
  console.log('🏁 FIM DOS TESTES DE CENÁRIOS');
}

// Exportar para window para facilitar teste no console
if (typeof window !== 'undefined') {
  (window as any).testSignup = testSignup;
  (window as any).testSignupScenarios = testSignupScenarios;
  console.log('🧪 Funções de teste disponíveis:');
  console.log('- testSignup() - Teste único');
  console.log('- testSignupScenarios() - Múltiplos cenários');
}