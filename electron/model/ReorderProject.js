import Settings_file from '../services/Settings_file.js';
import Logger from '../services/Logger.js';

class ReorderProject {
  /**
   * Reorders the projects array in settings.json based on an array of project IDs.
   * @param {Array<string|number>} orderedIds - Array of project IDs in the desired order
   * @returns {Promise<{status: boolean, message?: string, projects?: Array}>}
   */
  async reorder(orderedIds) {
    try {
      if (!Array.isArray(orderedIds)) {
        return { status: false, message: 'Invalid payload: orderedIds must be an array' };
      }

      const settings = await Settings_file.getFile();
      if (!settings || !Array.isArray(settings.projects)) {
        return { status: false, message: 'No projects found in settings.json' };
      }

      const projectMap = new Map();
      settings.projects.forEach((project) => {
        if (project && project.id != null) {
          projectMap.set(String(project.id), project);
        }
      });

      const reorderedProjects = [];

      // Add projects in the specified new order
      for (const id of orderedIds) {
        const strId = String(id);
        if (projectMap.has(strId)) {
          reorderedProjects.push(projectMap.get(strId));
          projectMap.delete(strId);
        }
      }

      // Append any remaining projects that were not in orderedIds
      for (const remaining of projectMap.values()) {
        reorderedProjects.push(remaining);
      }

      settings.projects = reorderedProjects;
      await Settings_file.WriteFile(settings);
      Logger.info(`Projects successfully reordered. New count: ${reorderedProjects.length}`);

      return { status: true, projects: reorderedProjects };
    } catch (error) {
      Logger.error('Error reordering projects:', error);
      return { status: false, message: error.message };
    }
  }
}

export default new ReorderProject();
