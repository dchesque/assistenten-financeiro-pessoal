import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usando service role para background
    )

    console.log('🤖 Iniciando processamento automático de alertas...');

    // Buscar todos os usuários ativos
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, nome, email')
      .eq('ativo', true);

    if (profilesError) throw profilesError;

    let totalAlertasProcessados = 0;
    let usuariosProcessados = 0;

    // Processar alertas para cada usuário
    for (const profile of profiles || []) {
      try {
        console.log(`Processing alerts for user: ${profile.nome} (${profile.id})`);

        // Chamar função de alertas para este usuário
        const { data: alertasData, error: alertasError } = await supabaseClient.functions.invoke(
          'alertas-vendedores',
          {
            headers: {
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
            }
          }
        );

        if (alertasError) {
          console.error(`Erro ao processar alertas para ${profile.nome}:`, alertasError);
          continue;
        }

        const alertas = alertasData?.alertas || [];
        const alertasCriticos = alertas.filter((a: any) => a.severidade === 'critica');

        console.log(`User ${profile.nome}: ${alertas.length} alerts, ${alertasCriticos.length} critical`);

        // Background task: Registrar alertas críticos no audit log
        if (alertasCriticos.length > 0) {
          EdgeRuntime.waitUntil(
            supabaseClient.from('audit_log').insert(
              alertasCriticos.map((alerta: any) => ({
                tabela: 'vendedores',
                operacao: 'alerta_critico_automatico',
                registro_id: alerta.vendedor_id,
                descricao: `[AUTOMÁTICO] ${alerta.titulo}: ${alerta.descricao}`,
                data_operacao: new Date().toISOString()
              }))
            )
          );
        }

        // Background task: Notificação por email para alertas críticos (simulado)
        if (alertasCriticos.length > 0 && profile.email) {
          EdgeRuntime.waitUntil(
            (async () => {
              console.log(`📧 Enviando notificação para ${profile.email}: ${alertasCriticos.length} alertas críticos`);
              
              // Aqui você integraria com um serviço de email como SendGrid, Resend, etc.
              // Por exemplo:
              // await sendEmailNotification(profile.email, alertasCriticos);
              
              // Por enquanto, apenas log
              console.log(`✅ Notificação processada para ${profile.nome}`);
            })()
          );
        }

        totalAlertasProcessados += alertas.length;
        usuariosProcessados++;

      } catch (userError) {
        console.error(`Erro ao processar usuário ${profile.nome}:`, userError);
        continue;
      }
    }

    // Background task: Estatísticas globais do sistema
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          // Calcular estatísticas globais
          const { data: vendedores } = await supabaseClient
            .from('vendedores')
            .select('id, meta_mensal, valor_total_vendido')
            .eq('ativo', true);

          const totalVendedores = vendedores?.length || 0;
          const metaTotal = vendedores?.reduce((acc, v) => acc + (v.meta_mensal || 0), 0) || 0;
          const faturamentoTotal = vendedores?.reduce((acc, v) => acc + (v.valor_total_vendido || 0), 0) || 0;

          // Log das estatísticas
          await supabaseClient.from('audit_log').insert({
            tabela: 'sistema',
            operacao: 'estatisticas_automaticas',
            descricao: `Processamento automático: ${usuariosProcessados} usuários, ${totalAlertasProcessados} alertas, ${totalVendedores} vendedores ativos`,
            data_operacao: new Date().toISOString()
          });

          console.log('📊 Estatísticas globais registradas');
        } catch (statsError) {
          console.error('Erro ao registrar estatísticas:', statsError);
        }
      })()
    );

    const resultado = {
      sucesso: true,
      usuarios_processados: usuariosProcessados,
      total_alertas: totalAlertasProcessados,
      processado_em: new Date().toISOString(),
      proxima_execucao: new Date(Date.now() + 60 * 60 * 1000).toISOString() // +1 hora
    };

    console.log('✅ Processamento automático concluído:', resultado);

    return new Response(
      JSON.stringify(resultado),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro no processamento automático:', error);
    
    return new Response(
      JSON.stringify({ 
        erro: 'Erro no processamento automático',
        detalhes: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});