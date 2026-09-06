const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/$/,
  ""
);

function buildUrl(path, query = {}) {
  const base = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");
  const url = new URL(`${base}${path}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, value);
  });

  return url;
}

async function request(path, { method = "GET", token, body, query } = {}) {
  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (err) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      throw new Error(
        "Unable to reach the backend server. Please ensure the backend is running on port 4000."
      );
    }
    throw err;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong while talking to the API.");
  }

  return data;
}

export const api = {
  signup(payload) {
    return request("/api/auth/signup", {
      method: "POST",
      body: payload
    });
  },
  login(payload) {
    return request("/api/auth/login", {
      method: "POST",
      body: payload
    });
  },
  me(token) {
    return request("/api/auth/me", {
      token
    });
  },
  createJob(token, payload) {
    return request("/api/pipeline/maps/jobs", {
      method: "POST",
      token,
      body: payload
    });
  },
  getJobs(token) {
    return request("/api/pipeline/maps/jobs", {
      token
    });
  },
  getJob(token, jobId) {
    return request(`/api/pipeline/maps/jobs/${jobId}`, {
      token
    });
  },
  getJobResults(token, jobId) {
    return request(`/api/pipeline/maps/jobs/${jobId}/results`, {
      token
    });
  },
  getBusinesses(token, query = {}) {
    return request("/api/pipeline/maps/businesses", {
      token,
      query
    });
  },
  stopJob(token, jobId) {
    return request(`/api/pipeline/maps/jobs/${jobId}/stop`, {
      method: "POST",
      token
    });
  },
  deleteBusiness(token, businessId) {
    return request(`/api/pipeline/maps/businesses/${businessId}`, {
      method: "DELETE",
      token
    });
  },
  bulkDeleteBusinesses(token, ids) {
    return request("/api/pipeline/maps/businesses/bulk-delete", {
      method: "POST",
      token,
      body: { ids }
    });
  },
  clearAllBusinesses(token) {
    return request("/api/pipeline/maps/businesses", {
      method: "DELETE",
      token
    });
  },
  updateBusinessStatus(token, businessId, status) {
    return request(`/api/pipeline/maps/businesses/${businessId}/status`, {
      method: "PATCH",
      token,
      body: { status }
    });
  }
};

export default api;
