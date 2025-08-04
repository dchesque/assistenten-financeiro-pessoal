-- Corrigir função classificar_venda_dre para resolver ambiguidade de cliente_id
CREATE OR REPLACE FUNCTION public.classificar_venda_dre(venda_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    venda_rec RECORD;
    categoria_dre_id INTEGER;
    tipo_dre_calculado VARCHAR(50);
BEGIN
    -- Buscar dados da venda com qualificação explícita de campos
    SELECT 
        v.id,
        v.tipo_venda,
        v.plano_conta_id,
        v.cliente_id,
        v.valor_final,
        v.ativo,
        pc.tipo_dre,
        pc.id as categoria_id  -- Renomeado para evitar conflito
    INTO venda_rec
    FROM vendas v
    LEFT JOIN plano_contas pc ON v.plano_conta_id = pc.id
    WHERE v.id = venda_id AND v.ativo = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venda não encontrada: %', venda_id;
    END IF;
    
    -- Determinar classificação DRE baseada no tipo de venda
    CASE venda_rec.tipo_venda
        WHEN 'produto' THEN
            tipo_dre_calculado := 'receita_vendas';
        WHEN 'servico' THEN
            tipo_dre_calculado := 'receita_servicos';
        WHEN 'devolucao' THEN
            tipo_dre_calculado := 'devolucoes_vendas';
        ELSE
            tipo_dre_calculado := 'outras_receitas';
    END CASE;
    
    -- Se não tem plano de contas ou o tipo DRE está vazio, buscar/criar categoria adequada
    IF venda_rec.plano_conta_id IS NULL OR venda_rec.tipo_dre IS NULL THEN
        -- Buscar categoria DRE apropriada
        SELECT pc.id INTO categoria_dre_id
        FROM plano_contas pc
        WHERE pc.tipo_dre = tipo_dre_calculado
        AND pc.aceita_lancamento = true
        AND pc.ativo = true
        LIMIT 1;
        
        -- Se não encontrou, criar categoria básica
        IF categoria_dre_id IS NULL THEN
            INSERT INTO plano_contas (
                codigo,
                nome,
                tipo_dre,
                aceita_lancamento,
                ativo
            ) VALUES (
                '3.' || LPAD(nextval('plano_contas_id_seq')::TEXT, 3, '0'),
                CASE tipo_dre_calculado
                    WHEN 'receita_vendas' THEN 'Receita de Vendas - Produtos'
                    WHEN 'receita_servicos' THEN 'Receita de Vendas - Serviços'
                    WHEN 'devolucoes_vendas' THEN 'Devoluções de Vendas'
                    ELSE 'Outras Receitas'
                END,
                tipo_dre_calculado,
                true,
                true
            ) RETURNING id INTO categoria_dre_id;
        END IF;
        
        -- Atualizar venda com a categoria correta
        UPDATE vendas 
        SET plano_conta_id = categoria_dre_id
        WHERE id = venda_id;
    END IF;
    
    -- Log da classificação
    INSERT INTO audit_log (
        tabela, operacao, registro_id, descricao
    ) VALUES (
        'dre', 'classificacao_automatica', venda_id,
        'Classificação automática DRE: ' || tipo_dre_calculado
    );
END;
$function$