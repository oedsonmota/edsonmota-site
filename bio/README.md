# Link na bio · Edson Mota

- Página: `edsonmota.com/bio` (`index.html` + `bio.js`). Lê o conteúdo da tabela `bio_site` (id `edson`) no Supabase `plataforma-cliente`; se o banco não responder, usa `default-content.js`.
- Painel: `edsonmota.com/bio/admin`. Login com o mesmo e-mail e senha da plataforma do cliente; só quem é admin em `profiles` edita.
- Visitas e cliques ficam em `bio_events`; o painel lê pelo `bio_stats`. Histórico de publicações em `bio_history`; imagens no bucket `bio`.
- Para separar origens: `edsonmota.com/bio?ref=stories`.
