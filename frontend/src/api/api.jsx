import axios from 'axios';

const API_BASE = 'http://88.200.63.148:12345';

export const getSessionUser = async () => {
  const response = await axios.get(`${API_BASE}/user/session`, { withCredentials: true });
  return response.data;
};

export const registerUser = async ({ username, email, password, file }) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('email', email);
  formData.append('password', password);
  formData.append('file', file);

  const response = await axios.post(`${API_BASE}/user/register`, formData);
  return response.data;
};