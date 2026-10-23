const stages = ['认知', '兴趣', '购买', '忠诚'];
module.exports = async function handler(req, res) {
  const send = (status, data) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(data)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { error: '请使用生成标题按钮提交。' }); }
  let input;
  try { input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return send(400, { error: '提交内容格式不正确。' }); }
  const { product_name, selling_point, stage } = input || {};
  if (typeof product_name !== 'string' || !product_name.trim() || [...product_name].length > 30) return send(400, { error: '商品名不能为空，且最多 30 字。' });
  if (typeof selling_point !== 'string' || !selling_point.trim() || [...selling_point].length > 100) return send(400, { error: '核心卖点不能为空，且最多 100 字。' });
  if (!stages.includes(stage)) return send(400, { error: '营销段必须是认知、兴趣、购买或忠诚。' });
  const base = process.env.DIFY_API_BASE, key = process.env.DIFY_API_KEY;
  if (!base || !key) return send(503, { error: '请先配置 Dify 地址和密钥。' });
  const controller = new AbortController();
  // 留出响应时间，避免 Vercel 在 60 秒硬限制处截断中文提示。
  const timer = setTimeout(() => controller.abort(), 59000);
  try {
    const response = await fetch(base.replace(/\/+$/, '') + '/workflows/run', {
      method: 'POST', redirect: 'error', signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: { product_name: product_name.trim(), selling_point: selling_point.trim(), stage }, response_mode: 'blocking', user: 'xiaozhou-web' })
    });
    if (!response.ok) throw new Error();
    const payload = await response.json();
    if (payload.data?.status && payload.data.status !== 'succeeded') throw new Error();
    const out = payload.data?.outputs;
    // 只返回约定的输出字段，人工复核优先。
    const safe = value => typeof value === 'string' && !value.includes(key);
    if (out && safe(out.verdict) && safe(out.draft)) return send(200, { type: 'review', verdict: out.verdict, draft: out.draft });
    if (out && safe(out.title) && out.title.trim()) return send(200, { type: 'safe', title: out.title });
    throw new Error();
  } catch { return send(controller.signal.aborted ? 504 : 502, { error: controller.signal.aborted ? '请再试一次' : '生成失败，请稍后再试。' }); }
  finally { clearTimeout(timer); }
};
