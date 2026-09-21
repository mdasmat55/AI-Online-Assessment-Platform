import api from "./api";

export const generateAssessment = async (assessmentData) => {
  const response = await api.post("/assessments/generate", assessmentData);

  return response.data;
};

export const getMyAssessments = async () => {
  const response = await api.get("/assessments/my-assessments");
  return response.data;
};

export const getAssessmentById = async (id) => {
  const response = await api.get(`/assessments/${id}`);
  return response.data;
};
