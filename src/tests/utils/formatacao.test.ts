import { 
  formatarMoeda, 
  formatarData, 
  aplicarMascaraCPF, 
  aplicarMascaraCNPJ,
  aplicarMascaraTelefone,
  aplicarMascaraCEP,
  validarCPF,
  validarCNPJ,
  validarEmail
} from '@/lib/formatacaoBrasileira';

describe('Formatação Brasileira', () => {
  describe('formatarMoeda', () => {
    it('deve formatar valores monetários corretamente', () => {
      expect(formatarMoeda(1234.56)).toBe('R$ 1.234,56');
      expect(formatarMoeda(0)).toBe('R$ 0,00');
      expect(formatarMoeda(1000000)).toBe('R$ 1.000.000,00');
      expect(formatarMoeda(999.99)).toBe('R$ 999,99');
    });

    it('deve lidar com valores negativos', () => {
      expect(formatarMoeda(-1234.56)).toBe('-R$ 1.234,56');
      expect(formatarMoeda(-0.01)).toBe('-R$ 0,01');
    });

    it('deve lidar com valores muito pequenos', () => {
      expect(formatarMoeda(0.01)).toBe('R$ 0,01');
      expect(formatarMoeda(0.99)).toBe('R$ 0,99');
    });

    it('deve lidar com strings numéricas', () => {
      expect(formatarMoeda('1234.56')).toBe('R$ 1.234,56');
      expect(formatarMoeda('0')).toBe('R$ 0,00');
    });
  });

  describe('formatarData', () => {
    it('deve formatar datas no padrão brasileiro', () => {
      expect(formatarData('2025-08-06')).toBe('06/08/2025');
      expect(formatarData('2023-12-25')).toBe('25/12/2023');
      expect(formatarData('2024-01-01')).toBe('01/01/2024');
    });

    it('deve lidar com objetos Date', () => {
      const data = new Date('2025-08-06T10:30:00');
      expect(formatarData(data)).toBe('06/08/2025');
    });

    it('deve lidar com datas inválidas', () => {
      expect(formatarData('data-inválida')).toBe('Data inválida');
      expect(formatarData('')).toBe('Data inválida');
    });
  });

  describe('aplicarMascaraCPF', () => {
    it('deve aplicar máscara de CPF corretamente', () => {
      expect(aplicarMascaraCPF('12345678909')).toBe('123.456.789-09');
      expect(aplicarMascaraCPF('00011122233')).toBe('000.111.222-33');
    });

    it('deve lidar com CPF parcial', () => {
      expect(aplicarMascaraCPF('123')).toBe('123');
      expect(aplicarMascaraCPF('12345')).toBe('123.45');
      expect(aplicarMascaraCPF('123456789')).toBe('123.456.789');
    });

    it('deve remover caracteres não numéricos', () => {
      expect(aplicarMascaraCPF('123.456.789-09')).toBe('123.456.789-09');
      expect(aplicarMascaraCPF('123abc456def789')).toBe('123.456.789');
    });
  });

  describe('aplicarMascaraCNPJ', () => {
    it('deve aplicar máscara de CNPJ corretamente', () => {
      expect(aplicarMascaraCNPJ('12345678000190')).toBe('12.345.678/0001-90');
      expect(aplicarMascaraCNPJ('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('deve lidar com CNPJ parcial', () => {
      expect(aplicarMascaraCNPJ('123')).toBe('123');
      expect(aplicarMascaraCNPJ('12345678')).toBe('12.345.678');
      expect(aplicarMascaraCNPJ('123456780001')).toBe('12.345.678/0001');
    });
  });

  describe('aplicarMascaraTelefone', () => {
    it('deve aplicar máscara de telefone celular', () => {
      expect(aplicarMascaraTelefone('11999887766')).toBe('(11) 99988-7766');
      expect(aplicarMascaraTelefone('21987654321')).toBe('(21) 98765-4321');
    });

    it('deve aplicar máscara de telefone fixo', () => {
      expect(aplicarMascaraTelefone('1133334444')).toBe('(11) 3333-4444');
      expect(aplicarMascaraTelefone('2155556666')).toBe('(21) 5555-6666');
    });

    it('deve lidar com telefone parcial', () => {
      expect(aplicarMascaraTelefone('11')).toBe('(11');
      expect(aplicarMascaraTelefone('119')).toBe('(11) 9');
      expect(aplicarMascaraTelefone('11999')).toBe('(11) 999');
    });
  });

  describe('aplicarMascaraCEP', () => {
    it('deve aplicar máscara de CEP', () => {
      expect(aplicarMascaraCEP('01310100')).toBe('01310-100');
      expect(aplicarMascaraCEP('22070900')).toBe('22070-900');
    });

    it('deve lidar com CEP parcial', () => {
      expect(aplicarMascaraCEP('123')).toBe('123');
      expect(aplicarMascaraCEP('12345')).toBe('12345');
      expect(aplicarMascaraCEP('123456')).toBe('12345-6');
    });
  });
});

describe('Validações Brasileiras', () => {
  describe('validarCPF', () => {
    it('deve validar CPFs corretos', () => {
      expect(validarCPF('11144477735')).toBe(true);
      expect(validarCPF('123.456.789-09')).toBe(true); // Fictício mas estruturalmente válido
    });

    it('deve rejeitar CPFs inválidos', () => {
      expect(validarCPF('11111111111')).toBe(false); // Todos iguais
      expect(validarCPF('123456789')).toBe(false); // Muito curto
      expect(validarCPF('12345678901')).toBe(false); // Dígitos incorretos
    });

    it('deve lidar com CPF com formatação', () => {
      expect(validarCPF('111.444.777-35')).toBe(true);
      expect(validarCPF('111-444-777-35')).toBe(true); // Formato alternativo
    });
  });

  describe('validarCNPJ', () => {
    it('deve validar CNPJs corretos', () => {
      expect(validarCNPJ('11222333000181')).toBe(true);
      expect(validarCNPJ('11.222.333/0001-81')).toBe(true);
    });

    it('deve rejeitar CNPJs inválidos', () => {
      expect(validarCNPJ('11111111111111')).toBe(false); // Todos iguais
      expect(validarCNPJ('123456789012')).toBe(false); // Muito curto
      expect(validarCNPJ('11222333000180')).toBe(false); // Dígito incorreto
    });
  });

  describe('validarEmail', () => {
    it('deve validar emails corretos', () => {
      expect(validarEmail('teste@exemplo.com')).toBe(true);
      expect(validarEmail('usuario.teste@dominio.com.br')).toBe(true);
      expect(validarEmail('user+tag@site.org')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(validarEmail('email-sem-arroba')).toBe(false);
      expect(validarEmail('@dominio.com')).toBe(false);
      expect(validarEmail('usuario@')).toBe(false);
      expect(validarEmail('usuario@dominio')).toBe(false);
      expect(validarEmail('')).toBe(false);
    });
  });
});

describe('Integração de Funções', () => {
  it('deve funcionar em conjunto para formatação completa', () => {
    const dados = {
      valor: 1500.75,
      data: '2025-08-06',
      cpf: '12345678909',
      telefone: '11999887766'
    };

    expect(formatarMoeda(dados.valor)).toBe('R$ 1.500,75');
    expect(formatarData(dados.data)).toBe('06/08/2025');
    expect(aplicarMascaraCPF(dados.cpf)).toBe('123.456.789-09');
    expect(aplicarMascaraTelefone(dados.telefone)).toBe('(11) 99988-7766');
  });

  it('deve manter consistência entre validação e formatação', () => {
    const cpfValido = '11144477735';
    const cpfFormatado = aplicarMascaraCPF(cpfValido);
    
    // CPF deve continuar válido após formatação
    expect(validarCPF(cpfFormatado)).toBe(true);
    
    const cnpjValido = '11222333000181';
    const cnpjFormatado = aplicarMascaraCNPJ(cnpjValido);
    
    // CNPJ deve continuar válido após formatação
    expect(validarCNPJ(cnpjFormatado)).toBe(true);
  });
});