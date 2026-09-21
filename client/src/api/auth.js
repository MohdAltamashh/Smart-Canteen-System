// client/src/api/auth.js

import axios from "axios";

// =====================================================
// AUTH API
// =====================================================

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const AUTH_URL = `${API_URL}/auth`;

// =====================================================
// REGISTER
// =====================================================

const register = async (userData) => {
  const response = await axios.post(
    `${AUTH_URL}/register`,
    userData
  );

  return response.data;
};

// =====================================================
// LOGIN
// =====================================================

const login = async (userData) => {
  const response = await axios.post(
    `${AUTH_URL}/login`,
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