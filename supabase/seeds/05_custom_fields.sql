-- Custom field definitions and values

-- Create custom field definitions for the organization
WITH org_info AS (SELECT id FROM organizations WHERE name = 'Acme')
INSERT INTO leads_custom_fields_definitions (
  organization_id, field_key, label, description, type, is_required,
  created_at, updated_at
)
SELECT 
  org_info.id,
  def_field_key, def_label, def_description, def_type, def_is_required,
  NOW(), NOW()
FROM org_info,
(VALUES 
  -- Address and location fields
  ('uf', 'Estado', 'Estado onde o lead está localizado', 'text', false),
  ('rua', 'Rua', 'Endereço - Rua', 'text', false),
  ('bairro', 'Bairro', 'Endereço - Bairro', 'text', false),
  ('numero', 'Número', 'Endereço - Número', 'text', false),
  ('cidade', 'Cidade', 'Cidade onde o lead está localizado', 'text', false),
  ('cep', 'CEP', 'Código postal do lead', 'text', false),
  
  -- Business relationship fields
  ('consultor', 'Consultor Responsável', 'Consultor designado para este lead', 'text', true),
  ('certificacoes', 'Certificações', 'Certificações profissionais do lead', 'text', false),
  ('area_interesse', 'Área de Interesse', 'Principal área de interesse do lead', 'text', false),
  ('orcamento', 'Orçamento', 'Faixa de orçamento disponível', 'text', false),
  
  -- Demographics and segmentation
  ('faixa_etaria', 'Faixa Etária', 'Faixa etária do lead', 'text', false),
  ('genero', 'Gênero', 'Gênero do lead', 'text', false),
  ('profissao', 'Profissão', 'Profissão detalhada do lead', 'text', false),
  ('experiencia', 'Anos de Experiência', 'Anos de experiência profissional', 'number', false),
  
  -- Business context
  ('tamanho_empresa', 'Tamanho da Empresa', 'Porte da empresa do lead', 'text', false),
  ('setor', 'Setor', 'Setor de atuação da empresa', 'text', false),
  ('cargo_nivel', 'Nível do Cargo', 'Nível hierárquico do cargo', 'text', false),
  ('decisor', 'É Decisor', 'Se o lead é decisor de compra', 'boolean', false),
  
  -- Engagement and preferences
  ('canal_preferido', 'Canal de Comunicação Preferido', 'Canal preferido para contato', 'text', false),
  ('melhor_horario', 'Melhor Horário', 'Melhor horário para contato', 'text', false),
  ('lingua_preferida', 'Idioma Preferido', 'Idioma preferido para comunicação', 'text', false),
  
  -- Tracking and attribution
  ('origem_detalhada', 'Origem Detalhada', 'Origem detalhada do lead', 'text', false),
  ('campanha_origem', 'Campanha de Origem', 'Campanha específica que trouxe o lead', 'text', false),
  ('data_primeiro_contato', 'Data do Primeiro Contato', 'Data do primeiro contato com o lead', 'date', false),
  
  -- Sales process
  ('status_vendas', 'Status no Processo de Vendas', 'Status atual no funil de vendas', 'text', false),
  ('proxima_acao', 'Próxima Ação', 'Próxima ação a ser realizada', 'text', false),
  ('temperatura', 'Temperatura do Lead', 'Nível de interesse/urgência', 'text', false)
) AS def_data(
  def_field_key, def_label, def_description, def_type, def_is_required
);

-- Create custom field values for selected leads
WITH org_info AS (SELECT id FROM organizations WHERE name = 'Acme'),
     lead_mapping AS (
       SELECT 
         l.id as lead_id,
         l.name as lead_name,
         l.email as lead_email
       FROM leads l
       JOIN organizations o ON l.organization_id = o.id
       WHERE o.name = 'Acme'
     )
INSERT INTO leads_custom_fields (
  lead_id, organization_id, field_key, field_value, created_at
)
SELECT 
  lm.lead_id,
  org_info.id,
  cf_field_key, cf_field_value,
  NOW()
FROM org_info, lead_mapping lm,
(VALUES 
  -- Maria Silva Santos - High-value enterprise lead
  ('maria.silva@techcorp.com.br', 'uf', 'SP'),
  ('maria.silva@techcorp.com.br', 'cidade', 'São Paulo'),
  ('maria.silva@techcorp.com.br', 'consultor', 'Carlos Eduardo Sales'),
  ('maria.silva@techcorp.com.br', 'certificacoes', 'PMP, ITIL, AWS Solutions Architect'),
  ('maria.silva@techcorp.com.br', 'area_interesse', 'Enterprise Solutions'),
  ('maria.silva@techcorp.com.br', 'orcamento', '100K-500K'),
  ('maria.silva@techcorp.com.br', 'setor', 'Technology'),
  ('maria.silva@techcorp.com.br', 'cargo_nivel', 'Executive'),
  ('maria.silva@techcorp.com.br', 'decisor', 'true'),
  ('maria.silva@techcorp.com.br', 'temperatura', 'Hot'),
  ('maria.silva@techcorp.com.br', 'status_vendas', 'Proposal Sent'),
  ('maria.silva@techcorp.com.br', 'proxima_acao', 'Follow-up on proposal'),
  
  -- Carlos Eduardo Mendes - Ready to buy
  ('carlos.mendes@inovacorp.com', 'uf', 'RJ'),
  ('carlos.mendes@inovacorp.com', 'cidade', 'Rio de Janeiro'),
  ('carlos.mendes@inovacorp.com', 'consultor', 'Ana Paula Vendas'),
  ('carlos.mendes@inovacorp.com', 'certificacoes', 'MBA, Lean Six Sigma'),
  ('carlos.mendes@inovacorp.com', 'area_interesse', 'Process Automation'),
  ('carlos.mendes@inovacorp.com', 'orcamento', '25K-50K'),
  ('carlos.mendes@inovacorp.com', 'setor', 'Manufacturing'),
  ('carlos.mendes@inovacorp.com', 'cargo_nivel', 'Management'),
  ('carlos.mendes@inovacorp.com', 'decisor', 'true'),
  ('carlos.mendes@inovacorp.com', 'temperatura', 'Very Hot'),
  ('carlos.mendes@inovacorp.com', 'status_vendas', 'Contract Review'),
  ('carlos.mendes@inovacorp.com', 'proxima_acao', 'Contract signing meeting'),
  
  -- Ana Paula Costa - CEO scaling company  
  ('ana.costa@megasolucoes.com.br', 'uf', 'MG'),
  ('ana.costa@megasolucoes.com.br', 'cidade', 'Belo Horizonte'),
  ('ana.costa@megasolucoes.com.br', 'consultor', 'Roberto Lima'),
  ('ana.costa@megasolucoes.com.br', 'certificacoes', 'MBA, CPA'),
  ('ana.costa@megasolucoes.com.br', 'area_interesse', 'Business Intelligence'),
  ('ana.costa@megasolucoes.com.br', 'orcamento', '50K-100K'),
  ('ana.costa@megasolucoes.com.br', 'setor', 'Consulting'),
  ('ana.costa@megasolucoes.com.br', 'cargo_nivel', 'C-Level'),
  ('ana.costa@megasolucoes.com.br', 'decisor', 'true'),
  ('ana.costa@megasolucoes.com.br', 'temperatura', 'Warm'),
  ('ana.costa@megasolucoes.com.br', 'status_vendas', 'Discovery'),
  ('ana.costa@megasolucoes.com.br', 'proxima_acao', 'Technical deep dive'),
  
  -- Roberto Lima Silva - Technical decision maker
  ('roberto.lima@digisystems.net', 'uf', 'PR'),
  ('roberto.lima@digisystems.net', 'cidade', 'Curitiba'),
  ('roberto.lima@digisystems.net', 'consultor', 'Patricia Moura'),
  ('roberto.lima@digisystems.net', 'certificacoes', 'Java Certified, AWS DevOps'),
  ('roberto.lima@digisystems.net', 'area_interesse', 'Technical Architecture'),
  ('roberto.lima@digisystems.net', 'orcamento', '10K-25K'),
  ('roberto.lima@digisystems.net', 'setor', 'Software Development'),
  ('roberto.lima@digisystems.net', 'cargo_nivel', 'Technical Leadership'),
  ('roberto.lima@digisystems.net', 'decisor', 'true'),
  ('roberto.lima@digisystems.net', 'temperatura', 'Warm'),
  ('roberto.lima@digisystems.net', 'status_vendas', 'Technical Evaluation'),
  ('roberto.lima@digisystems.net', 'proxima_acao', 'POC setup'),
  
  -- Juliana Ferreira - Startup founder
  ('juliana.ferreira@startupbr.co', 'uf', 'CE'),
  ('juliana.ferreira@startupbr.co', 'cidade', 'Fortaleza'),
  ('juliana.ferreira@startupbr.co', 'consultor', 'Fernanda Oliveira'),
  ('juliana.ferreira@startupbr.co', 'certificacoes', 'MBA Startups'),
  ('juliana.ferreira@startupbr.co', 'area_interesse', 'Growth Analytics'),
  ('juliana.ferreira@startupbr.co', 'orcamento', '1K-5K'),
  ('juliana.ferreira@startupbr.co', 'setor', 'Technology Startup'),
  ('juliana.ferreira@startupbr.co', 'cargo_nivel', 'Founder'),
  ('juliana.ferreira@startupbr.co', 'decisor', 'true'),
  ('juliana.ferreira@startupbr.co', 'temperatura', 'Cold'),
  ('juliana.ferreira@startupbr.co', 'status_vendas', 'Nurturing'),
  ('juliana.ferreira@startupbr.co', 'proxima_acao', 'Educational content sharing'),
  
  -- Larissa Monteiro Silva - Growth hacker
  ('larissa.monteiro@ecommercepro.com.br', 'uf', 'PE'),
  ('larissa.monteiro@ecommercepro.com.br', 'cidade', 'Recife'),
  ('larissa.monteiro@ecommercepro.com.br', 'consultor', 'Marcos Antonio'),
  ('larissa.monteiro@ecommercepro.com.br', 'certificacoes', 'Google Analytics, Facebook Blueprint'),
  ('larissa.monteiro@ecommercepro.com.br', 'area_interesse', 'E-commerce Analytics'),
  ('larissa.monteiro@ecommercepro.com.br', 'orcamento', '5K-15K'),
  ('larissa.monteiro@ecommercepro.com.br', 'setor', 'E-commerce'),
  ('larissa.monteiro@ecommercepro.com.br', 'cargo_nivel', 'Management'),
  ('larissa.monteiro@ecommercepro.com.br', 'decisor', 'true'),
  ('larissa.monteiro@ecommercepro.com.br', 'temperatura', 'Hot'),
  ('larissa.monteiro@ecommercepro.com.br', 'status_vendas', 'Trial User'),
  ('larissa.monteiro@ecommercepro.com.br', 'proxima_acao', 'Trial to paid conversion'),
  
  -- Cristina Rocha Andrade - CFO interested in cost reduction
  ('cristina.andrade@grupobrasil.com', 'uf', 'BA'),
  ('cristina.andrade@grupobrasil.com', 'cidade', 'Salvador'),
  ('cristina.andrade@grupobrasil.com', 'consultor', 'João Carlos'),
  ('cristina.andrade@grupobrasil.com', 'certificacoes', 'CPA, CFA, MBA Finance'),
  ('cristina.andrade@grupobrasil.com', 'area_interesse', 'Financial Analytics'),
  ('cristina.andrade@grupobrasil.com', 'orcamento', '50K-100K'),
  ('cristina.andrade@grupobrasil.com', 'setor', 'Financial Services'),
  ('cristina.andrade@grupobrasil.com', 'cargo_nivel', 'C-Level'),
  ('cristina.andrade@grupobrasil.com', 'decisor', 'true'),
  ('cristina.andrade@grupobrasil.com', 'temperatura', 'Warm'),
  ('cristina.andrade@grupobrasil.com', 'status_vendas', 'Executive Briefing'),
  ('cristina.andrade@grupobrasil.com', 'proxima_acao', 'ROI presentation'),
  
  -- Patricia Moura Costa - Healthcare founder
  ('patricia.moura@healthtech.med.br', 'uf', 'DF'),
  ('patricia.moura@healthtech.med.br', 'cidade', 'Brasília'),
  ('patricia.moura@healthtech.med.br', 'consultor', 'Thiago Barbosa'),
  ('patricia.moura@healthtech.med.br', 'certificacoes', 'MD, MBA Healthcare'),
  ('patricia.moura@healthtech.med.br', 'area_interesse', 'Healthcare Compliance'),
  ('patricia.moura@healthtech.med.br', 'orcamento', '15K-30K'),
  ('patricia.moura@healthtech.med.br', 'setor', 'Healthcare'),
  ('patricia.moura@healthtech.med.br', 'cargo_nivel', 'Founder'),
  ('patricia.moura@healthtech.med.br', 'decisor', 'true'),
  ('patricia.moura@healthtech.med.br', 'temperatura', 'Hot'),
  ('patricia.moura@healthtech.med.br', 'status_vendas', 'Security Review'),
  ('patricia.moura@healthtech.med.br', 'proxima_acao', 'Compliance documentation'),
  
  -- Eduardo Fernandes Cunha - Fintech product manager
  ('eduardo.fernandes@fintech.startup', 'uf', 'RJ'),
  ('eduardo.fernandes@fintech.startup', 'cidade', 'Rio de Janeiro'),
  ('eduardo.fernandes@fintech.startup', 'consultor', 'Vanessa Santos'),
  ('eduardo.fernandes@fintech.startup', 'certificacoes', 'Product Management, Agile'),
  ('eduardo.fernandes@fintech.startup', 'area_interesse', 'User Analytics'),
  ('eduardo.fernandes@fintech.startup', 'orcamento', '8K-20K'),
  ('eduardo.fernandes@fintech.startup', 'setor', 'Fintech'),
  ('eduardo.fernandes@fintech.startup', 'cargo_nivel', 'Management'),
  ('eduardo.fernandes@fintech.startup', 'decisor', 'false'),
  ('eduardo.fernandes@fintech.startup', 'temperatura', 'Warm'),
  ('eduardo.fernandes@fintech.startup', 'status_vendas', 'Product Evaluation'),
  ('eduardo.fernandes@fintech.startup', 'proxima_acao', 'User analytics demo'),
  
  -- Some leads without extensive custom fields for variety
  ('marcos.pereira@gmail.com', 'uf', 'SC'),
  ('marcos.pereira@gmail.com', 'consultor', 'Daniel Souza'),
  ('marcos.pereira@gmail.com', 'area_interesse', 'Freelance Tools'),
  ('marcos.pereira@gmail.com', 'orcamento', '< 1K'),
  ('marcos.pereira@gmail.com', 'setor', 'Freelancing'),
  ('marcos.pereira@gmail.com', 'temperatura', 'Cold'),
  
  ('pedro.souza@localtech.com.br', 'consultor', 'Camila Dias'),
  ('pedro.souza@localtech.com.br', 'area_interesse', 'API Integration'),
  ('pedro.souza@localtech.com.br', 'setor', 'Technology Services'),
  ('pedro.souza@localtech.com.br', 'temperatura', 'Warm'),
  
  -- Add some Brazilian state and city diversity
  ('fernando.oliveira@consultoria.net', 'uf', 'GO'),
  ('fernando.oliveira@consultoria.net', 'cidade', 'Goiânia'),
  ('fernando.oliveira@consultoria.net', 'consultor', 'Bianca Oliveira'),
  ('fernando.oliveira@consultoria.net', 'setor', 'Business Consulting'),
  ('fernando.oliveira@consultoria.net', 'temperatura', 'Cold')
) AS cf_data(
  lead_email, cf_field_key, cf_field_value
)
WHERE lm.lead_email = cf_data.lead_email;