export default async function handler(req, res) {
  const mod = await import('../backend/dist/main.js');
  const server = mod.default;
  return server(req, res);
}
