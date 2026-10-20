
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

/**
 * Common API request helper.
 * Authenticated requests automatically include the Owner JWT.
 */
async function apiRequest(endpoint, options = {}, requireAuth = true) {
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  // Owner authentication for protected endpoints
  if (requireAuth) {
    const token = sessionStorage.getItem("scs_owner_token");

    if (!token) {
      throw new Error("Owner login required. Please log in again.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";

  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? data.detail || data.message
        : data;

    if (response.status === 401 && requireAuth) {
      throw new Error(
        "Your Owner session may have expired. Please log in again."
      );
    }

    throw new Error(
      message || `API request failed (${response.status}).`
    );
  }

  return data;
}

// ==========================================
// LEADS — OWNER LOGIN REQUIRED
// ==========================================

export function getLeads() {
  return apiRequest("/leads/");
}

export function createLead(leadData) {
  return apiRequest("/leads/", {
    method: "POST",
    body: JSON.stringify(leadData),
  });
}

export function updateLead(leadId, leadData) {
  return apiRequest(`/leads/${leadId}`, {
    method: "PUT",
    body: JSON.stringify(leadData),
  });
}

export function deleteLead(leadId) {
  return apiRequest(`/leads/${leadId}`, {
    method: "DELETE",
  });
}

// ==========================================
// CONVERT LEAD TO CRM CUSTOMER
// OWNER LOGIN REQUIRED
// ==========================================

export function convertLeadToCustomer(leadId) {
  if (!leadId) {
    throw new Error("A valid Lead ID is required.");
  }

  return apiRequest(`/leads/${leadId}/convert-to-customer`, {
    method: "POST",
  });
}

// ==========================================
// PUBLIC CHATBOT INQUIRY — NO LOGIN REQUIRED
// ==========================================

export function createPublicInquiry(inquiryData) {
  return apiRequest(
    "/leads/public-inquiry",
    {
      method: "POST",
      body: JSON.stringify({
        name: inquiryData.name,
        email: inquiryData.email,
        phone: inquiryData.phone,
        company: inquiryData.company ?? null,
        status: "New",
        source: inquiryData.source || "Website Chatbot",
        notes: inquiryData.notes ?? null,
      }),
    },
    false
  );
}

// ==========================================
// CRM CUSTOMERS — OWNER LOGIN REQUIRED
// ==========================================

export function getCustomers() {
  return apiRequest("/customers/");
}

export function createCustomer(customerData) {
  return apiRequest("/customers/", {
    method: "POST",
    body: JSON.stringify(customerData),
  });
}

export function updateCustomer(customerId, customerData) {
  return apiRequest(`/customers/${customerId}`, {
    method: "PUT",
    body: JSON.stringify(customerData),
  });
}

export function deleteCustomer(customerId) {
  return apiRequest(`/customers/${customerId}`, {
    method: "DELETE",
  });
}

// ==========================================
// AI CHAT — NO OWNER LOGIN REQUIRED
// ==========================================

export function sendChatMessage(message) {
  return apiRequest(
    "/ai/chat",
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
    false
  );
}
