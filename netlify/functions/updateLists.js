// netlify/functions/updateLists.js
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1) Import dinámico para burlar el ESM de octokit
    const { Octokit } = await import("@octokit/rest");

    // 2) Crea la instancia de Octokit PASÁNDOLE fetch
    const octokit = new Octokit({
      auth: process.env.GH_TOKEN,
      request: {
        fetch: globalThis.fetch
      }
    });

    // 3) Extrae las listas del body
    const { lists } = JSON.parse(event.body);
    const owner = "gonzaloruizalonso";
    const repo  = "gonzaloruizalonso.github.io";
    const path  = "lists.json";

    // 4) Lee el SHA actual de lists.json
    const { data: file } = await octokit.repos.getContent({ owner, repo, path });
    const sha = file.sha;

    // 5) Prepara el contenido nuevo en Base64
    const newContent = Buffer
      .from(JSON.stringify({ Item: lists }, null, 2))
      .toString("base64");

    // 6) Hacer commit del fichero actualizado
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "⚡️ Actualizo lists.json desde la app",
      content: newContent,
      sha
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (error) {
    console.error("Error en updateLists:", error);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
