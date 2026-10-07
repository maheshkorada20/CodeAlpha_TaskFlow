import React, { createContext, useContext, useState, useCallback } from 'react';
import projectService from '../services/projectService';

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [currentProject, setCurrentProject] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await projectService.getProjectById(id);
      if (res.success && res.data?.project) {
        setCurrentProject(res.data.project);
        setUserRole(res.data.project.userRole || 'member');
        return res.data.project;
      }
    } catch (err) {
      setError(err.message || 'Failed to load project');
      setCurrentProject(null);
      setUserRole(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProjectState = useCallback((updatedFields) => {
    setCurrentProject((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  }, []);

  const isOwner = userRole === 'owner' || userRole === 'admin';
  const isManager = userRole === 'manager' || isOwner;

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        userRole,
        isOwner,
        isManager,
        isLoading,
        error,
        fetchProject,
        updateProjectState,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;
