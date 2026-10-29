# Anne Carvalho Imóveis — SPEC

Plataforma imobiliária (pt-BR, R$) da corretora **Anne Carvalho** (marca exibida: "Anne Carvalho · Corretora de Imóveis" — NÃO "Anne Carvalho Imóveis" no cabeçalho, por pedido da cliente). CRECI 337285, WhatsApp 5515997378634. Região: Sorocaba/Votorantim (qualquer cidade aceita).

## Stack
FastAPI + MongoDB (motor) em /api; React 19 + Vite + Tailwind v4 + shadcn (base-ui). Fontes Playfair Display (títulos) + Plus Jakarta Sans.

## Dados (coleções)
- `users` — administradora única (pbkdf2). Criada no PRIMEIRO acesso em /admin/login (`POST /api/auth/setup` só funciona com 0 usuários; depois 409).
- `settings` (id="site") — marca, CRECI, WhatsApp, telefone, e-mail, endereço, textos da home, logo/foto/hero (URLs de upload), redes sociais, taxa do simulador, retenção LGPD.
- `properties` — kind `venda|locacao|lancamento`, status `rascunho|publicado|arquivado`, commercial_status `disponivel|reservado|alugado|vendido`, code único (V-/L-/E-xxxxxx), slug amigável, typologies[] (lançamentos), images[], video/pdf/tour, derivados price_low/price_high.
- `developers` — construtoras (seed: Yees).
- `leads` — dedupe por WhatsApp (dígitos) OU e-mail; interests[] (1 por imóvel, sem duplicar), stage + stage_history[] (nunca apagado), notes[], visit_requests[] (pendente/confirmada/cancelada), source (utm_source/referer/site), utm{}, marketing_optin, day (America/Sao_Paulo).
- `events` — whatsapp_click, share, property_view, lead_created, lead_interest, visit_requested.
- `testimonials` — só reais, cadastrados no admin.

## Regras-chave
- Bloqueio de lead NO SERVIDOR: `GET /api/properties/{slug}` sem cookie `ac_lead` válido → `unlocked=false`, só 2 imagens, description/pdf/video/tour/condo/iptu/endereço = null. Com cookie (setado por `POST /api/leads` após salvar) → tudo liberado. Vale para todos os imóveis no mesmo navegador (90 dias).
- `/api/admin/*` exigem cookie de sessão `ac_session` (401 sem login).
- Lead: honeypot `hp`, rate limit 10/h por IP, aceite de privacidade obrigatório, WhatsApp 10–13 dígitos.
- WhatsApp: links wa.me com mensagem contendo nome do cliente + título + código. Cliques registrados como eventos (o envio é confirmado pelo cliente no app).
- Visita solicitada fica "pendente" até a corretora confirmar no CRM.
- Favoritos/comparação (máx. 3) ficam no localStorage (conveniência); dados de negócio só no Mongo.
- LGPD: /politica-privacidade, opt-in de marketing separado e desmarcado, exclusão pelo próprio cliente (`DELETE /api/leads/self`) e pela admin.

## Rotas públicas
/, /lancamentos, /comprar, /alugar, /imoveis, /imoveis/:slug, /empreendimentos/:slug, /locacao/:slug, /sobre, /contato, /favoritos, /comparar, /simulador, /politica-privacidade.
## Admin
/admin/login, /admin (dashboard), /admin/imoveis (+ /novo, /:id), /admin/leads (kanban 7 etapas + lista, export CSV/XLSX), /admin/depoimentos, /admin/construtoras, /admin/configuracoes.

## Seed
`cd /app/backend && python seed.py` — só settings padrão + construtora Yees. Catálogo, leads e depoimentos começam VAZIOS por design.
