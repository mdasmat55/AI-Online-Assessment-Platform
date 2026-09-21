import api from "./api";

export const getMyAssessments = async () => {
  const response = await api.get("/assessments/my-assessments");

  return response.data;
};

export const getMyAttempts = async () => {
  const response = await api.get("/attempts/my-attempts");

  return response.data;
};

export const startAssessmentAttempt = async (assessmentId) => {
  const response = await api.post(`/attempts/${assessmentId}/start`);

  return response.data;
};
