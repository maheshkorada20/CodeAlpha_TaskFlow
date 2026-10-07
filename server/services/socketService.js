let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;
};

const getIO = () => {
  return ioInstance;
};

const emitToProject = (projectId, event, data) => {
  if (ioInstance && projectId) {
    ioInstance.to(`project:${projectId.toString()}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId.toString()}`).emit(event, data);
  }
};

const emitGlobal = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToProject,
  emitToUser,
  emitGlobal,
};
