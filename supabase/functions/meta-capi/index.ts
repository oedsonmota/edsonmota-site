// API de Conversões da Meta para o edsonmota.com.
// Recebe os eventos do site e repassa para a Meta com IP e navegador do visitante.
// O token NÃO fica aqui: ele é lido da variável de ambiente META_CAPI_TOKEN (Secrets do Supabase).

const PIXEL = "2402324527192610";
const VERSAO = "v26.0";
const ORIGENS = ["https://edsonmota.com", "https://www.edsonmota.com"];
const EVENTOS = new Set(["PageView", "ViewContent", "AbriuAplicacao", "Lead"]);
const HEX64 = /^[a-f0-9]{64}$/;

function cors(origem: string | null) {
  const ok = origem && ORIGENS.includes(origem) ? origem : ORIGENS[0];
  return {
    "Access-Control-Allow-Origin": ok,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}

function texto(v: unknown, max = 500): string | undefined {
  return typeof v === "string" && v.length > 0 ? v.slice(0, max) : undefined;
}

Deno.serve(async (req) => {
  const origem = req.headers.get("origin");
  const h = cors(origem);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return new Response("método não aceito", { status: 405, headers: h });
  if (!origem || !ORIGENS.includes(origem)) return new Response("origem não aceita", { status: 403, headers: h });

  const token = Deno.env.get("META_CAPI_TOKEN");
  if (!token) return new Response("token não configurado", { status: 500, headers: h });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return new Response("json inválido", { status: 400, headers: h }); }

  const nome = texto(b.event_name, 40);
  const id = texto(b.event_id, 80);
  if (!nome || !EVENTOS.has(nome) || !id) return new Response("evento inválido", { status: 400, headers: h });

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
  const ua = req.headers.get("user-agent") || undefined;

  const user_data: Record<string, unknown> = { client_ip_address: ip, client_user_agent: ua };
  const fbp = texto(b.fbp, 200), fbc = texto(b.fbc, 500);
  if (fbp) user_data.fbp = fbp;
  if (fbc) user_data.fbc = fbc;
  const ud = (b.user_data || {}) as Record<string, unknown>;
  for (const k of ["em", "ph", "fn", "ln"]) {
    const v = ud[k];
    if (typeof v === "string" && HEX64.test(v)) user_data[k] = [v];
  }

  const evento = {
    event_name: nome,
    event_time: Math.floor(Date.now() / 1000),
    event_id: id,
    action_source: "website",
    event_source_url: texto(b.event_source_url, 1000),
    user_data,
    custom_data: (b.custom_data && typeof b.custom_data === "object") ? b.custom_data : {},
  };

  const corpo: Record<string, unknown> = { data: [evento] };
  const teste = texto(b.test_event_code, 40);
  if (teste) corpo.test_event_code = teste;

  const r = await fetch(`https://graph.facebook.com/${VERSAO}/${PIXEL}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const resposta = await r.text();
  if (!r.ok) console.error("Meta respondeu", r.status, resposta.slice(0, 500));
  return new Response(JSON.stringify({ ok: r.ok }), { status: r.ok ? 200 : 502, headers: { ...h, "Content-Type": "application/json" } });
});
