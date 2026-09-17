// client/src/api/auth.js

import axios from "axios";

// =====================================================
// AUTH API
// =====================================================

const API_URL =
  "http://localhost:5000/api/auth/";

// =====================================================
// REGISTER
// =====================================================

const register = async (userData) => {
  const response = await axios.post(
    `${API_URL}register`,
    userData
  );

  return response.data;
};

// =====================================================
// LOGIN
// =====================================================

const login = async (userData) => {
  const response = await axios.post(
    `${API_URL}login`,
    userData
  );

  return response.data;
};

// =====================================================
// EXPORT
// =====================================================

const auth = {
  register,
  login,
};

export default auth;