// netlify/functions/updateLists.js

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Import dinámico de Octokit y cross-fetch
    const [{ Octokit }, { fetch }] = await Promise.all([
      import("@octokit/rest"),
      import("cross-fetch")
    ]);

    // Creamos la instancia inyectando fetch
    const octokit = new Octokit({
      auth: process.env.GH_TOKEN,
      request: { fetch }
    });

    // Extraemos las listas del body
    const { lists } = JSON.parse(event.body);
    const owner = "gonzaloruizalonso";
    const repo  = "gonzaloruizalonso.github.io";
    const path  = "lists.json";

    // Leemos el SHA actual
    const { data: file } = await octokit.repos.getContent({ owner, repo, path });
    const sha = file.sha;

    // Preparamos el JSON actualizado en base64
    const content = Buffer
      .from(JSON.stringify({ Item: lists }, null, 2))
      .toString("base64");

    // Commit en GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "⚡️ Actualizo lists.json desde la app",
      content,
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
