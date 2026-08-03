// Sends form data to the backend and returns the parsed JSON response.
async function postForm(url, urlSearchParams) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: urlSearchParams.toString()
  });
  return response.json();
}

// Shows a message box above the form (used for both errors and success messages).
function showFlash(message, type) {
  const flash = document.getElementById('flash');
  if (!flash) return;
  flash.textContent = message;
  flash.className = 'flash flash-' + (type || 'error');
  flash.style.display = 'block';
}

// Called automatically by Google's Sign-In button once the user approves access.
// response.credential is a signed ID token; the backend verifies it with Google directly.
function handleGoogleLogin(response) {
  const form = new URLSearchParams();
  form.set('credential', response.credential);
  postForm('/api/google-login', form).then(res => {
    if (res.ok) {
      window.location.href = 'dashboard.html';
    } else {
      showFlash(res.message || 'Google sign-in failed.', 'error');
    }
  });
}