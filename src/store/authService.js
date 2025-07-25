export const verifyAuth = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/auth/verify', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (credentials) => {
  const response = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }
  
  return await response.json();
};

export const logoutUser = async () => {
  await fetch('http://localhost:5001/api/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
};