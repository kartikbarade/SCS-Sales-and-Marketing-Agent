const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function getLeads() {
  const response = await fetch(`${API_BASE_URL}/leads/`);

  if (!response.ok) {
    throw new Error("Leads fetch karta ale nahi.");
  }

  return response.json();
}

export async function createLead(leadData) {
  const response = await fetch(`${API_BASE_URL}/leads/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(leadData),
  });

  if (!response.ok) {
    throw new Error("Lead save karta ali nahi.");
  }

  return response.json();
}

export async function updateLead(leadId, leadData) {
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(leadData),
  });

  if (!response.ok) {
    throw new Error("Lead update karta ali nahi.");
  }

  return response.json();
}

export async function deleteLead(leadId) {
  const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Lead delete karta ali nahi.");
  }

  return response.json();
}


export async function sendChatMessage(message) {
  const response = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("AI assistant kadun response milala nahi.");
  }

  return response.json();
}
