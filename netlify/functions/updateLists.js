// netlify/functions/updateLists.js

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1) Import dinámico de Octokit (funciona en CommonJS)
    const { Octokit } = await import("@octokit/rest");

    const { lists } = JSON.parse(event.body);
    const octokit = new Octokit({ auth: process.env.GH_TOKEN });

    const owner = "gonzaloruizalonso";
    const repo  = "gonzaloruizalonso.github.io";
    const path  = "lists.json";

    // 2) Obtenemos el SHA actual del fichero
    const { data: file } = await octokit.repos.getContent({ owner, repo, path });
    const sha = file.sha;

    // 3) Preparamos el contenido nuevo en base64
    const content = Buffer
      .from(JSON.stringify({ Item: lists }, null, 2))
      .toString("base64");

    // 4) Creamos o actualizamos el fichero en GitHub
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
