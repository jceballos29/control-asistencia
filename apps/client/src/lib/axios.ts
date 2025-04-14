import axios from "axios";

// const BASE_URL = "http://localhost:8000"

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});