// netlify/functions/updateLists.js
const { Octokit } = require("@octokit/rest");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { lists } = JSON.parse(event.body);
    const octokit = new Octokit({ auth: process.env.GH_TOKEN });
    const owner = "gonzaloruizalonso";
    const repo  = "gonzaloruizalonso.github.io";
    const path  = "lists.json";

    // 1) Obtener SHA actual
    const {
      data: { sha }
    } = await octokit.repos.getContent({ owner, repo, path });

    // 2) Preparar contenido nuevo en Base64
    const content = Buffer
      .from(JSON.stringify({ Item: lists }, null, 2))
      .toString("base64");

    // 3) Commit de actualización
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
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
