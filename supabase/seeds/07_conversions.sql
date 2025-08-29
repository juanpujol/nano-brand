-- Conversion tracking data

-- Create realistic conversion events for each lead
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
INSERT INTO conversions (
  lead_id, organization_id, name, identifier, external_id, external_source,
  date, value, source, utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_channel,
  conversion_url, conversion_domain, device, raw_payload
)
SELECT 
  lm.lead_id,
  org_info.id,
  conv_name, conv_identifier, conv_external_id, conv_external_source,
  conv_date, conv_value, conv_source, conv_utm_source, conv_utm_medium, conv_utm_campaign, conv_utm_content, conv_utm_term, conv_utm_channel,
  conv_url, conv_domain, conv_device, conv_raw_payload
FROM org_info, lead_mapping lm,
(VALUES 
  -- High-value leads (A score) - Multiple conversions showing strong engagement
  
  -- Maria Silva Santos (maria.silva@techcorp.com.br) - Enterprise lead, 5 conversions
  ('maria.silva@techcorp.com.br', 'Enterprise Whitepaper Download', 'whitepaper-download', 'f47ac10b-wp-001', 'rd_station', NOW() - INTERVAL '14 days', 250.00, 'website', 'google', 'cpc', 'enterprise-demo', 'homepage', 'enterprise software', 'search', 'https://site.com/whitepapers/enterprise-guide', 'site.com', 'desktop', '{"lead_score": 85, "session_duration": 420}'::jsonb),
  ('maria.silva@techcorp.com.br', 'Demo Request Submitted', 'demo-request', 'f47ac10b-demo-001', 'rd_station', NOW() - INTERVAL '12 days', 500.00, 'website', 'google', 'cpc', 'enterprise-demo', 'homepage', 'enterprise software', 'search', 'https://site.com/demo/request', 'site.com', 'desktop', '{"interest_level": "high", "budget_confirmed": true}'::jsonb),
  ('maria.silva@techcorp.com.br', 'Pricing Page View', 'pricing-view', 'f47ac10b-price-001', 'rd_station', NOW() - INTERVAL '11 days', 150.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/pricing/enterprise', 'site.com', 'desktop', '{"page_time": 340, "plan_viewed": "enterprise"}'::jsonb),
  ('maria.silva@techcorp.com.br', 'Proposal Document View', 'proposal-view', 'f47ac10b-prop-001', 'hubspot', NOW() - INTERVAL '9 days', 750.00, 'email', 'email', 'campaign', 'follow-up-sequence', 'proposal-link', 'proposal download', 'email', 'https://site.com/proposals/maria-silva', 'site.com', 'mobile', '{"document_opened": true, "time_spent": 180}'::jsonb),
  ('maria.silva@techcorp.com.br', 'Contract Review Started', 'contract-review', 'f47ac10b-contract-001', 'hubspot', NOW() - INTERVAL '8 days', 1000.00, 'email', 'email', 'campaign', 'follow-up-sequence', 'contract-link', 'contract review', 'email', 'https://site.com/contracts/review', 'site.com', 'desktop', '{"status": "in_review", "sections_viewed": 8}'::jsonb),

  -- Carlos Eduardo Mendes (carlos.mendes@inovacorp.com) - Ready to buy, 4 conversions
  ('carlos.mendes@inovacorp.com', 'Product Demo Attended', 'demo-attended', '6ba7b816-demo-001', 'hubspot', NOW() - INTERVAL '7 days', 600.00, 'social', 'linkedin', 'referral', 'sales-outreach', 'profile-link', 'automation software', 'social', 'https://site.com/demo/live', 'site.com', 'desktop', '{"demo_duration": 45, "questions_asked": 12}'::jsonb),
  ('carlos.mendes@inovacorp.com', 'ROI Calculator Used', 'roi-calc', '6ba7b816-roi-001', 'hubspot', NOW() - INTERVAL '6 days', 300.00, 'social', 'linkedin', 'referral', 'sales-outreach', 'profile-link', 'automation software', 'social', 'https://site.com/tools/roi-calculator', 'site.com', 'desktop', '{"estimated_savings": 50000, "implementation_time": "3-6months"}'::jsonb),
  ('carlos.mendes@inovacorp.com', 'Case Study Downloaded', 'case-study', '6ba7b816-case-001', 'hubspot', NOW() - INTERVAL '4 days', 200.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/cases/manufacturing-automation', 'site.com', 'mobile', '{"industry_match": true, "similar_company_size": true}'::jsonb),
  ('carlos.mendes@inovacorp.com', 'Contract Signed', 'contract-signed', '6ba7b816-sign-001', 'hubspot', NOW() - INTERVAL '2 days', 2000.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/contracts/sign', 'site.com', 'desktop', '{"contract_value": 45000, "term_months": 24}'::jsonb),

  -- Cristina Rocha Andrade (cristina.andrade@grupobrasil.com) - CFO, 4 conversions
  ('cristina.andrade@grupobrasil.com', 'Financial ROI Report Download', 'roi-report', 'f47ac10d-roi-001', 'rd_station', NOW() - INTERVAL '19 days', 400.00, 'email', 'email', 'campaign', 'cfo-newsletter', 'article-link', 'financial automation', 'email', 'https://site.com/reports/financial-roi', 'site.com', 'desktop', '{"report_type": "financial", "pages_viewed": 15}'::jsonb),
  ('cristina.andrade@grupobrasil.com', 'Cost Analysis Webinar', 'webinar-attended', 'f47ac10d-webinar-001', 'rd_station', NOW() - INTERVAL '17 days', 350.00, 'email', 'email', 'campaign', 'cfo-newsletter', 'webinar-invite', 'cost reduction', 'email', 'https://site.com/webinars/cost-analysis', 'site.com', 'desktop', '{"attendance_duration": 55, "questions_submitted": 3}'::jsonb),
  ('cristina.andrade@grupobrasil.com', 'Executive Brief Requested', 'exec-brief', 'f47ac10d-brief-001', 'rd_station', NOW() - INTERVAL '15 days', 500.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/executive-brief/request', 'site.com', 'desktop', '{"executive_level": "cfo", "company_size": "enterprise"}'::jsonb),
  ('cristina.andrade@grupobrasil.com', 'Budget Planning Tool Used', 'budget-tool', 'f47ac10d-budget-001', 'rd_station', NOW() - INTERVAL '13 days', 300.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/tools/budget-planner', 'site.com', 'desktop', '{"annual_savings": 75000, "payback_period": "18months"}'::jsonb),

  -- Patricia Moura Costa (patricia.moura@healthtech.med.br) - Healthcare founder, 3 conversions
  ('patricia.moura@healthtech.med.br', 'HIPAA Compliance Guide', 'compliance-guide', '6ba7b813-hipaa-001', 'hubspot', NOW() - INTERVAL '6 days', 300.00, 'website', 'google', 'cpc', 'healthtech-demo', 'demo-form', 'hipaa compliant', 'search', 'https://site.com/compliance/hipaa-guide', 'site.com', 'desktop', '{"compliance_focus": "healthcare", "security_priority": "high"}'::jsonb),
  ('patricia.moura@healthtech.med.br', 'Security Demo Scheduled', 'security-demo', '6ba7b813-sec-001', 'hubspot', NOW() - INTERVAL '5 days', 400.00, 'website', 'google', 'cpc', 'healthtech-demo', 'demo-form', 'hipaa compliant', 'search', 'https://site.com/demo/security', 'site.com', 'desktop', '{"demo_focus": "security", "compliance_requirements": "hipaa"}'::jsonb),
  ('patricia.moura@healthtech.med.br', 'Healthcare Case Study', 'healthcare-case', '6ba7b813-case-001', 'hubspot', NOW() - INTERVAL '3 days', 250.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/cases/healthcare-startup', 'site.com', 'mobile', '{"industry_focus": "healthcare", "startup_stage": "early"}'::jsonb),

  -- Good leads (B score) - Moderate engagement

  -- Ana Paula Costa (ana.costa@megasolucoes.com.br) - CEO scaling, 3 conversions
  ('ana.costa@megasolucoes.com.br', 'Scaling Business Guide', 'scaling-guide', '6ba7b810-scale-001', 'hubspot', NOW() - INTERVAL '21 days', 200.00, 'referral', 'partner-site', 'referral', 'partner-program', 'partner-page', 'scaling solutions', 'referral', 'https://site.com/guides/scaling-business', 'site.com', 'desktop', '{"business_stage": "scaling", "employee_count": "50-100"}'::jsonb),
  ('ana.costa@megasolucoes.com.br', 'BI Dashboard Demo', 'bi-demo', '6ba7b810-bi-001', 'hubspot', NOW() - INTERVAL '19 days', 350.00, 'referral', 'partner-site', 'referral', 'partner-program', 'partner-page', 'scaling solutions', 'referral', 'https://site.com/demo/business-intelligence', 'site.com', 'desktop', '{"demo_modules": ["reporting", "analytics"], "integration_interest": true}'::jsonb),
  ('ana.costa@megasolucoes.com.br', 'Integration Checklist', 'integration-check', '6ba7b810-int-001', 'hubspot', NOW() - INTERVAL '17 days', 150.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/resources/integration-checklist', 'site.com', 'mobile', '{"current_tools": ["crm", "erp"], "complexity": "medium"}'::jsonb),

  -- Roberto Lima Silva (roberto.lima@digisystems.net) - Technical CTO, 4 conversions
  ('roberto.lima@digisystems.net', 'Architecture Whitepaper', 'arch-whitepaper', '6ba7b811-arch-001', 'hubspot', NOW() - INTERVAL '17 days', 300.00, 'organic', 'google', 'organic', null, 'blog-post', 'system architecture', 'search', 'https://site.com/whitepapers/system-architecture', 'site.com', 'desktop', '{"technical_level": "advanced", "architecture_focus": "microservices"}'::jsonb),
  ('roberto.lima@digisystems.net', 'API Documentation Access', 'api-docs', '6ba7b811-api-001', 'hubspot', NOW() - INTERVAL '15 days', 150.00, 'organic', 'google', 'organic', null, 'blog-post', 'system architecture', 'search', 'https://site.com/developers/api-docs', 'site.com', 'desktop', '{"api_endpoints_viewed": 15, "code_samples_copied": 8}'::jsonb),
  ('roberto.lima@digisystems.net', 'Technical POC Request', 'poc-request', '6ba7b811-poc-001', 'hubspot', NOW() - INTERVAL '13 days', 500.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/poc/technical-request', 'site.com', 'desktop', '{"poc_duration": "30days", "technical_requirements": "detailed"}'::jsonb),
  ('roberto.lima@digisystems.net', 'Implementation Guide', 'impl-guide', '6ba7b811-impl-001', 'hubspot', NOW() - INTERVAL '11 days', 200.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/guides/implementation', 'site.com', 'desktop', '{"implementation_complexity": "medium", "timeline": "3months"}'::jsonb),

  -- João Carlos Ribeiro (joao.ribeiro@fabrica.ind.br) - Manufacturing manager, 3 conversions
  ('joao.ribeiro@fabrica.ind.br', 'Manufacturing Efficiency Report', 'manufacturing-report', '6ba7b812-mfg-001', 'hubspot', NOW() - INTERVAL '34 days', 250.00, 'website', 'google', 'cpc', 'manufacturing-keywords', 'landing-page', 'production efficiency', 'search', 'https://site.com/reports/manufacturing-efficiency', 'site.com', 'desktop', '{"industry": "manufacturing", "focus": "efficiency"}'::jsonb),
  ('joao.ribeiro@fabrica.ind.br', 'Production Metrics Webinar', 'production-webinar', '6ba7b812-prod-001', 'hubspot', NOW() - INTERVAL '31 days', 200.00, 'website', 'google', 'cpc', 'manufacturing-keywords', 'webinar-signup', 'production optimization', 'search', 'https://site.com/webinars/production-metrics', 'site.com', 'desktop', '{"webinar_duration": 40, "industry_focus": "manufacturing"}'::jsonb),
  ('joao.ribeiro@fabrica.ind.br', 'Factory Integration Case', 'factory-case', '6ba7b812-case-001', 'hubspot', NOW() - INTERVAL '27 days', 180.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/cases/factory-automation', 'site.com', 'mobile', '{"industry_match": true, "automation_level": "moderate"}'::jsonb),

  -- Larissa Monteiro Silva (larissa.monteiro@ecommercepro.com.br) - Growth hacker, 3 conversions
  ('larissa.monteiro@ecommercepro.com.br', 'E-commerce Analytics Guide', 'ecomm-analytics', 'f47ac10e-ecomm-001', 'rd_station', NOW() - INTERVAL '13 days', 180.00, 'social', 'facebook', 'cpc', 'growth-hacking', 'ad-creative-a', 'ecommerce growth', 'social', 'https://site.com/guides/ecommerce-analytics', 'site.com', 'mobile', '{"ecommerce_platform": "shopify", "monthly_revenue": "100k+"}'::jsonb),
  ('larissa.monteiro@ecommercepro.com.br', 'Growth Metrics Dashboard Demo', 'growth-demo', 'f47ac10e-growth-001', 'rd_station', NOW() - INTERVAL '11 days', 300.00, 'social', 'facebook', 'cpc', 'growth-hacking', 'ad-creative-a', 'ecommerce growth', 'social', 'https://site.com/demo/growth-metrics', 'site.com', 'desktop', '{"demo_focus": "growth_metrics", "conversion_tracking": true}'::jsonb),
  ('larissa.monteiro@ecommercepro.com.br', 'Free Trial Started', 'trial-start', 'f47ac10e-trial-001', 'rd_station', NOW() - INTERVAL '8 days', 400.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/trial/signup', 'site.com', 'desktop', '{"trial_type": "14day", "features_enabled": "growth_suite"}'::jsonb),

  -- Eduardo Fernandes Cunha (eduardo.fernandes@fintech.startup) - Fintech PM, 2 conversions
  ('eduardo.fernandes@fintech.startup', 'User Analytics Demo', 'user-analytics', '6ba7b814-user-001', 'hubspot', NOW() - INTERVAL '15 days', 250.00, 'social', 'producthunt', 'social', 'product-launch', 'ph-listing', 'user analytics', 'social', 'https://site.com/demo/user-analytics', 'site.com', 'desktop', '{"demo_focus": "user_behavior", "fintech_specific": true}'::jsonb),
  ('eduardo.fernandes@fintech.startup', 'Product Analytics Webinar', 'product-webinar', '6ba7b814-prod-001', 'hubspot', NOW() - INTERVAL '12 days', 200.00, 'social', 'producthunt', 'social', 'product-launch', 'ph-listing', 'product analytics', 'social', 'https://site.com/webinars/product-analytics', 'site.com', 'mobile', '{"webinar_topic": "product_analytics", "industry": "fintech"}'::jsonb),

  -- Alessandro Martinez Santos (alessandro.martinez@remotework.global) - Remote team lead, 2 conversions
  ('alessandro.martinez@remotework.global', 'Remote Team Collaboration Guide', 'remote-collab', '6ba7b815-remote-001', 'hubspot', NOW() - INTERVAL '25 days', 150.00, 'content', 'medium', 'content', 'remote-work-article', 'article-cta', 'remote productivity', 'content', 'https://site.com/guides/remote-collaboration', 'site.com', 'desktop', '{"team_size": "15-20", "remote_experience": "3years"}'::jsonb),
  ('alessandro.martinez@remotework.global', 'Productivity Tools Demo', 'productivity-demo', '6ba7b815-prod-001', 'hubspot', NOW() - INTERVAL '21 days', 200.00, 'content', 'medium', 'content', 'remote-work-article', 'demo-request', 'productivity tools', 'content', 'https://site.com/demo/productivity-suite', 'site.com', 'desktop', '{"demo_focus": "remote_productivity", "team_management": true}'::jsonb),

  -- Medium leads (C score) - Basic engagement

  -- Juliana Ferreira (juliana.ferreira@startupbr.co) - Startup founder, 2 conversions
  ('juliana.ferreira@startupbr.co', 'Startup Analytics Basics', 'startup-basics', 'f47ac113-startup-001', 'rd_station', NOW() - INTERVAL '24 days', 50.00, 'social', 'facebook', 'social', 'startup-event', 'booth-scan', 'startup tools', 'social', 'https://site.com/guides/startup-analytics', 'site.com', 'mobile', '{"startup_stage": "early", "budget_tier": "starter"}'::jsonb),
  ('juliana.ferreira@startupbr.co', 'Free Tier Signup', 'free-signup', 'f47ac113-free-001', 'rd_station', NOW() - INTERVAL '22 days', 100.00, 'social', 'facebook', 'social', 'startup-event', 'signup-form', 'free tier', 'social', 'https://site.com/signup/free', 'site.com', 'mobile', '{"plan": "free", "startup_verified": true}'::jsonb),

  -- Pedro Henrique Souza (pedro.souza@localtech.com.br) - Developer, 2 conversions
  ('pedro.souza@localtech.com.br', 'Developer Documentation', 'dev-docs', null, null, NOW() - INTERVAL '29 days', 30.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/developers/getting-started', 'site.com', 'desktop', '{"developer_level": "intermediate", "integration_interest": "api"}'::jsonb),
  ('pedro.souza@localtech.com.br', 'Code Examples Downloaded', 'code-examples', null, null, NOW() - INTERVAL '26 days', 50.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/developers/code-examples', 'site.com', 'desktop', '{"programming_language": "javascript", "framework": "react"}'::jsonb),

  -- Ricardo Nunes Oliveira (ricardo.nunes@agenciaweb.com) - Agency owner, 2 conversions
  ('ricardo.nunes@agenciaweb.com', 'Agency Partner Program', 'partner-program', 'f47ac114-partner-001', 'rd_station', NOW() - INTERVAL '39 days', 150.00, 'referral', 'referral', 'word-of-mouth', null, null, null, 'referral', 'https://site.com/partners/agency-program', 'site.com', 'desktop', '{"agency_size": "small", "client_count": "15-20"}'::jsonb),
  ('ricardo.nunes@agenciaweb.com', 'Client Management Tools', 'client-tools', 'f47ac114-tools-001', 'rd_station', NOW() - INTERVAL '35 days', 100.00, 'direct', 'direct', null, null, null, null, 'direct', 'https://site.com/tools/client-management', 'site.com', 'desktop', '{"agency_focus": "web_development", "tool_interest": "client_reporting"}'::jsonb),

  -- Vanessa Santos Lima (vanessa.santos@retailchain.com.br) - Retail operations, 1 conversion
  ('vanessa.santos@retailchain.com.br', 'Retail Operations Guide', 'retail-ops', 'f47ac10f-retail-001', 'rd_station', NOW() - INTERVAL '27 days', 80.00, 'social', 'facebook', 'retargeting', 'retail-ops', 'dynamic-ad', 'retail management', 'social', 'https://site.com/guides/retail-operations', 'site.com', 'mobile', '{"retail_type": "chain", "locations": "multiple"}'::jsonb),

  -- Gabriela Torres Marques (gabriela.torres@edtech.online) - Educational director, 1 conversion
  ('gabriela.torres@edtech.online', 'Learning Analytics Report', 'learning-analytics', 'f47ac115-learning-001', 'rd_station', NOW() - INTERVAL '32 days', 120.00, 'event', 'event', 'conference', 'edtech-summit', 'presentation-slide', 'learning analytics', 'event', 'https://site.com/reports/learning-analytics', 'site.com', 'desktop', '{"education_focus": "online_learning", "student_base": "1000+"}'::jsonb),

  -- Isabela Rocha Mendes (isabela.rocha@proptech.imob) - Real estate broker, 1 conversion
  ('isabela.rocha@proptech.imob', 'Property Management Tools', 'property-tools', 'f47ac111-prop-001', 'rd_station', NOW() - INTERVAL '18 days', 90.00, 'social', 'instagram', 'social', 'realestate-content', 'story-swipe', 'property management', 'social', 'https://site.com/tools/property-management', 'site.com', 'mobile', '{"property_type": "residential", "portfolio_size": "50-100"}'::jsonb),

  -- Bianca Oliveira Cruz (bianca.oliveira@sustentavel.eco.br) - ESG specialist, 1 conversion
  ('bianca.oliveira@sustentavel.eco.br', 'Sustainability Metrics Guide', 'sustainability-guide', 'f47ac116-sust-001', 'rd_station', NOW() - INTERVAL '36 days', 100.00, 'social', 'linkedin', 'organic', null, 'event-post', 'sustainability tech', 'social', 'https://site.com/guides/sustainability-metrics', 'site.com', 'desktop', '{"focus": "esg_reporting", "company_type": "consulting"}'::jsonb),

  -- Low-interest leads (D/F score) - Minimal engagement

  -- Fernanda Oliveira (fernanda.oliveira@consultoria.net) - Consultant, 1 conversion
  ('fernanda.oliveira@consultoria.net', 'Business Consulting Resources', 'consulting-resources', 'f47ac10c-consult-001', 'rd_station', NOW() - INTERVAL '11 days', 25.00, 'social', 'linkedin', 'cpc', 'consultant-targeting', 'ad-carousel', 'business consulting', 'social', 'https://site.com/resources/consulting', 'site.com', 'desktop', '{"consultant_type": "strategy", "client_focus": "multiple"}'::jsonb),

  -- Marcos Antonio Pereira (marcos.pereira@gmail.com) - Freelancer, 1 conversion
  ('marcos.pereira@gmail.com', 'Freelancer Tools Overview', 'freelancer-tools', null, null, NOW() - INTERVAL '4 days', 15.00, 'organic', 'google', 'organic', null, 'contact-form', 'freelance inquiry', 'search', 'https://site.com/tools/freelancer', 'site.com', 'mobile', '{"freelancer_type": "individual", "experience": "beginner"}'::jsonb),

  -- Thiago Barbosa Alves (thiago.barbosa@logisticabr.com) - IT coordinator, 1 conversion  
  ('thiago.barbosa@logisticabr.com', 'Logistics Analytics Overview', 'logistics-overview', '6ba7b817-logistics-001', 'hubspot', NOW() - INTERVAL '48 days', 40.00, 'organic', 'organic', 'search', null, null, null, 'search', 'https://site.com/industries/logistics', 'site.com', 'desktop', '{"industry": "logistics", "role": "it_coordinator"}'::jsonb),

  -- Rafael Costa Pereira (rafael.costa@agroinovacao.agr.br) - Agricultural engineer, 1 conversion
  ('rafael.costa@agroinovacao.agr.br', 'AgTech Innovation Blog', 'agtech-blog', 'f47ac110-agtech-001', 'rd_station', NOW() - INTERVAL '44 days', 20.00, 'organic', 'google', 'organic', null, 'blog-article', 'agtech innovation', 'search', 'https://site.com/blog/agtech-innovation', 'site.com', 'mobile', '{"industry": "agriculture", "innovation_focus": "technology"}'::jsonb),

  -- Daniel Souza Barbosa (daniel.souza@mobilidade.transport) - Data analyst, 1 conversion
  ('daniel.souza@mobilidade.transport', 'Mobility Data Analytics', 'mobility-data', '6ba7b818-mobility-001', 'hubspot', NOW() - INTERVAL '40 days', 35.00, 'developer', 'github', 'referral', 'open-source', 'readme-link', 'mobility data', 'developer', 'https://site.com/analytics/mobility-data', 'site.com', 'desktop', '{"data_focus": "urban_mobility", "technical_level": "intermediate"}'::jsonb),

  -- Felipe Machado Silva (felipe.machado@gamedev.studio) - Game designer, 1 conversion
  ('felipe.machado@gamedev.studio', 'Game Analytics Basics', 'game-analytics', 'f47ac112-game-001', 'rd_station', NOW() - INTERVAL '20 days', 30.00, 'community', 'discord', 'community', 'gamedev-discussion', 'bot-link', 'game analytics', 'community', 'https://site.com/gaming/analytics-basics', 'site.com', 'desktop', '{"game_type": "indie", "platform": "pc_mobile"}'::jsonb)

  -- Camila Dias Rodrigues (camila.dias@socialimpact.org.br) - NGO coordinator, no conversions (F score)
  -- This lead has minimal engagement, so no conversions are created

) AS conv_data(
  lead_email, conv_name, conv_identifier, conv_external_id, conv_external_source,
  conv_date, conv_value, conv_source, conv_utm_source, conv_utm_medium, conv_utm_campaign, conv_utm_content, conv_utm_term, conv_utm_channel,
  conv_url, conv_domain, conv_device, conv_raw_payload
)
WHERE lm.lead_email = conv_data.lead_email;