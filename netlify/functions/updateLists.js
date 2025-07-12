// netlify/functions/updateLists.js
exports.handler = async (event) => {
  // Import dinámico y fetch
  const [{ Octokit }, { fetch }] = await Promise.all([
    import("@octokit/rest"),
    import("cross-fetch")
  ]);
  const octokit = new Octokit({ auth: process.env.GH_TOKEN, request: { fetch }});
  const owner = "gonzaloruizalonso", repo = "gonzaloruizalonso.github.io", path = "lists.json";

  if (event.httpMethod === "GET") {
    // Leer y devolver
    const { data: file } = await octokit.repos.getContent({ owner, repo, path });
    const json = JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
    return { statusCode: 200, body: JSON.stringify({ lists: json.Item }) };
  }

  if (event.httpMethod === "POST") {
    // Actualizar
    const { lists } = JSON.parse(event.body);
    const { data: file } = await octokit.repos.getContent({ owner, repo, path });
    const sha = file.sha;
    const content = Buffer.from(JSON.stringify({ Item: lists }, null, 2)).toString("base64");
    await octokit.repos.createOrUpdateFileContents({ owner, repo, path, message: "⚡️ Actualizo lists.json", content, sha });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
