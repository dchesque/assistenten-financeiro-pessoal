-- Inserir mais dados de exemplo para demonstração

-- Inserir vendas de maquininha de exemplo para janeiro 2025
INSERT INTO public.vendas_maquininha (
    maquininha_id, 
    nsu, 
    data_venda, 
    data_recebimento, 
    valor_bruto, 
    valor_taxa, 
    valor_liquido, 
    taxa_percentual_cobrada, 
    bandeira, 
    tipo_transacao, 
    parcelas, 
    periodo_processamento
)
SELECT 
    m.id,
    'NSU' || LPAD((ROW_NUMBER() OVER())::TEXT, 6, '0'),
    ('2025-01-' || LPAD((ROW_NUMBER() OVER() % 30 + 1)::TEXT, 2, '0'))::DATE,
    ('2025-01-' || LPAD((ROW_NUMBER() OVER() % 30 + 2)::TEXT, 2, '0'))::DATE,
    ROUND((RANDOM() * 500 + 50)::NUMERIC, 2),
    ROUND((RANDOM() * 20 + 5)::NUMERIC, 2),
    ROUND((RANDOM() * 480 + 40)::NUMERIC, 2),
    ROUND((RANDOM() * 3 + 1.5)::NUMERIC, 2),
    CASE (ROW_NUMBER() OVER() % 3)
        WHEN 0 THEN 'visa'
        WHEN 1 THEN 'mastercard'
        ELSE 'elo'
    END,
    CASE (ROW_NUMBER() OVER() % 3)
        WHEN 0 THEN 'debito'
        WHEN 1 THEN 'credito_vista'
        ELSE 'credito_parcelado'
    END,
    CASE WHEN (ROW_NUMBER() OVER() % 3) = 2 THEN (ROW_NUMBER() OVER() % 12 + 1) ELSE 1 END,
    '2025-01'
FROM public.maquininhas m, generate_series(1, 20) AS s;

-- Inserir recebimentos bancários de exemplo
INSERT INTO public.recebimentos_bancario (
    banco_id,
    data_recebimento,
    valor,
    descricao,
    tipo_operacao,
    documento,
    periodo_processamento
)
SELECT 
    1, -- Banco padrão
    ('2025-01-' || LPAD((ROW_NUMBER() OVER() % 30 + 2)::TEXT, 2, '0'))::DATE,
    ROUND((RANDOM() * 2000 + 500)::NUMERIC, 2),
    CASE (ROW_NUMBER() OVER() % 2)
        WHEN 0 THEN 'REDE S.A. - RECEBIMENTO'
        ELSE 'SIPAG LTDA - CREDITO'
    END,
    'TED',
    'DOC' || LPAD((ROW_NUMBER() OVER())::TEXT, 8, '0'),
    '2025-01'
FROM generate_series(1, 10);

-- Criar conciliações de exemplo
INSERT INTO public.conciliacoes_maquininha (
    periodo,
    maquininha_id,
    data_conciliacao,
    total_vendas,
    total_recebimentos,
    total_taxas,
    status
)
SELECT 
    '2025-01',
    m.id,
    '2025-01-31'::DATE,
    COALESCE(vendas.total_vendas, 0),
    COALESCE(recebimentos.total_recebimentos, 0),
    COALESCE(vendas.total_taxas, 0),
    CASE 
        WHEN ABS(COALESCE(vendas.total_vendas, 0) - COALESCE(recebimentos.total_recebimentos, 0)) <= 1 THEN 'ok'
        ELSE 'divergencia'
    END
FROM public.maquininhas m
LEFT JOIN (
    SELECT 
        vm.maquininha_id,
        SUM(vm.valor_liquido) as total_vendas,
        SUM(vm.valor_taxa) as total_taxas
    FROM public.vendas_maquininha vm
    WHERE vm.periodo_processamento = '2025-01'
    GROUP BY vm.maquininha_id
) vendas ON m.id = vendas.maquininha_id
LEFT JOIN (
    SELECT 
        m2.id as maquininha_id,
        SUM(rb.valor) / 2 as total_recebimentos -- Dividir por número de maquininhas
    FROM public.maquininhas m2
    CROSS JOIN (
        SELECT SUM(valor) as valor FROM public.recebimentos_bancario 
        WHERE periodo_processamento = '2025-01'
    ) rb
    GROUP BY m2.id
) recebimentos ON m.id = recebimentos.maquininha_id
WHERE m.ativo = true;