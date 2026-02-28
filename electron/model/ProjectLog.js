import fs from "fs";
import path from "path";
import Settings_file from "../services/Settings_file.js";

class ProjectLog {
  async getTail(iPayload) {
    try {
      const { id, lines } = iPayload ?? {};
      if (!id) {
        return { status: false, error: "Invalid project id." };
      }

      const settingsFile = await Settings_file.getFile();
      const project = settingsFile.projects.find((item) => item.id === id);
      if (!project) {
        return { status: false, error: "Project not found." };
      }

      const logsFolder = path.join(project.settings.userDir, "logs");
      if (!fs.existsSync(logsFolder)) {
        return { status: true, text: "", file: null };
      }

      const files = await fs.promises.readdir(logsFolder);
      const logFiles = files.filter((fileName) => fileName.endsWith("_log_nodered.txt"));
      if (logFiles.length === 0) {
        return { status: true, text: "", file: null };
      }

      const logsWithStat = await Promise.all(
        logFiles.map(async (fileName) => {
          const filePath = path.join(logsFolder, fileName);
          const stat = await fs.promises.stat(filePath);
          return { fileName, filePath, mtimeMs: stat.mtimeMs };
        })
      );

      logsWithStat.sort((a, b) => b.mtimeMs - a.mtimeMs);
      const latestLog = logsWithStat[0];
      const text = await this.#tailFile(latestLog.filePath, Number(lines) || 120);

      return { status: true, text, file: latestLog.fileName };
    } catch (error) {
      return { status: false, error: error.message };
    }
  }

  async #tailFile(filePath, lineCount) {
    const stat = await fs.promises.stat(filePath);
    if (!stat.size) return "";

    const maxBytes = 256 * 1024;
    const readSize = Math.min(stat.size, maxBytes);
    const start = stat.size - readSize;

    const handle = await fs.promises.open(filePath, "r");
    try {
      const buffer = Buffer.alloc(readSize);
      await handle.read(buffer, 0, readSize, start);
      const raw = buffer.toString("utf8");
      const normalized = raw.replace(/\r\n/g, "\n");
      const lines = normalized.split("\n");
      return lines.slice(-lineCount).join("\n");
    } finally {
      await handle.close();
    }
  }
}

export default new ProjectLog();
