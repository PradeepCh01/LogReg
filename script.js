// Selectors
const loginForm = document.querySelector('.login-form');
const registerForm = document.querySelector('.register-form');
const passwordStrengthText = document.getElementById('strength-text');
const strengthSegments = document.querySelectorAll('.strength-segment');

// Password Strength
function checkPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  updateStrengthIndicator(strength);
}

function updateStrengthIndicator(strength) {
  strengthSegments.forEach(s => s.style.backgroundColor = '#e2e8f0');
  if (strength <= 2) {
    passwordStrengthText.textContent = 'Weak';
    passwordStrengthText.style.color = '#ef4444';
    strengthSegments[0].style.backgroundColor = '#ef4444';
  } else if (strength <= 4) {
    passwordStrengthText.textContent = 'Moderate';
    passwordStrengthText.style.color = '#f59e0b';
    strengthSegments[0].style.backgroundColor = '#f59e0b';
    strengthSegments[1].style.backgroundColor = '#f59e0b';
  } else {
    passwordStrengthText.textContent = 'Strong';
    passwordStrengthText.style.color = '#10b981';
    strengthSegments.forEach(s => s.style.backgroundColor = '#10b981');
  }
}

// Password Visibility Toggle (Fixed)
document.querySelectorAll('.toggle-password').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const input = toggle.closest('.input-with-icon')?.querySelector('input');
    const icon = toggle.querySelector('i');
    if (!input || !icon) return;
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });
});

// Social Login (Dummy)
function socialLogin(provider) {
  window.location.href = provider === 'Google'
    ? 'https://accounts.google.com'
    : 'https://github.com';
}

// Show error below form
function showError(id, message) {
  const errorDiv = document.getElementById(id);
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// Switch section
function switchSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  location.hash = `#${id}`;
}

// Password Hashing
function hashPassword(password) {
  return btoa(unescape(encodeURIComponent(password)));
}
function verifyPassword(inputPassword, storedPassword) {
  return hashPassword(inputPassword) === storedPassword;
}

// Token Generation
function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(Math.random().toString(36).substring(2));
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Register Function
function register(e) {
  e.preventDefault();
  const form = e.target;
  const { name, email, pNumber, password, cPassword, terms } = form;
  const btn = form.querySelector('button[type="submit"]');
  btn.querySelector('.loading-icon').style.display = 'inline-block';

  setTimeout(() => {
    if (!name.value.trim()) return markInvalid(name, 'Full name is required');
    if (!email.value.trim()) return markInvalid(email, 'Email is required');
    if (!pNumber.value.trim()) return markInvalid(pNumber, 'Phone number is required');
    if (!password.value) return markInvalid(password, 'Password is required');
    if (!cPassword.value) return markInvalid(cPassword, 'Please confirm your password');
    if (password.value !== cPassword.value) return markInvalid(cPassword, 'Passwords do not match');
    if (!terms.checked) return showError('register-error', 'You must agree to the terms');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return markInvalid(email, 'Invalid email');
    if (!/^\d{10}$/.test(pNumber.value)) return markInvalid(pNumber, 'Phone must be 10 digits');
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(password.value)) {
      return markInvalid(password, 'Password must have letters, numbers & symbol');
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.name === name.value.trim())) return markInvalid(name, 'Username already exists');
    if (users.find(u => u.email === email.value.trim())) return markInvalid(email, 'Email already exists');

    const token = generateToken({ name: name.value, email: email.value });
    users.push({
      name: name.value,
      email: email.value,
      pNumber: pNumber.value,
      password: hashPassword(password.value),
      token,
      createdAt: new Date().toISOString(),
      lastLogin: null
    });

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify({ name: name.value, email: email.value }));

    btn.querySelector('.loading-icon').style.display = 'none';
    showToast('Registration successful!', 'success');
    setTimeout(() => switchSection('dashboard'), 1500);
  }, 1000);

  function markInvalid(input, message) {
    input.style.borderColor = '#ef4444';
    showError('register-error', message);
    btn.querySelector('.loading-icon').style.display = 'none';
  }
}

// Login Function
function login(e) {
  e.preventDefault();
  const form = e.target;
  const { username, password, remember } = form;
  const btn = form.querySelector('button[type="submit"]');
  btn.querySelector('.loading-icon').style.display = 'inline-block';

  setTimeout(() => {
    if (!username.value.trim()) return markInvalid(username, 'Username or email required');
    if (!password.value) return markInvalid(password, 'Password is required');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u =>
      (u.name === username.value || u.email === username.value) &&
      verifyPassword(password.value, u.password)
    );

    if (!user) return showInvalid('Invalid credentials');

    user.lastLogin = new Date().toISOString();
    const token = generateToken({ name: user.name });
    user.token = token;

    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('authToken', token);
    localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }));

    if (remember?.checked) {
      localStorage.setItem('rememberedUser', username.value);
    } else {
      localStorage.removeItem('rememberedUser');
    }

    btn.querySelector('.loading-icon').style.display = 'none';
    showToast('Login successful!', 'success');
    setTimeout(() => switchSection('dashboard'), 1500);
  }, 1000);

  function markInvalid(input, message) {
    input.style.borderColor = '#ef4444';
    showError('login-error', message);
    btn.querySelector('.loading-icon').style.display = 'none';
  }

  function showInvalid(message) {
    markInvalid(username, '');
    markInvalid(password, message);
  }
}

// Toast Notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Attach Form Events
if (loginForm) loginForm.addEventListener('submit', login);
if (registerForm) registerForm.addEventListener('submit', register);

// Password Strength Checker
if (registerForm && passwordStrengthText) {
  const passwordInput = registerForm.querySelector('input[name="password"]');
  passwordInput?.addEventListener('input', e => checkPasswordStrength(e.target.value));
}

// Auth Check on Page Load
document.addEventListener('DOMContentLoaded', () => {
  if (location.hash === '#dashboard') {
    checkAuth();
    initDashboard();
    setupEventListeners();
  }
});

// Auth + Dashboard
function checkAuth() {
  const token = localStorage.getItem('authToken');
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.token === token);
  if (!user) {
    localStorage.clear();
    switchSection('login');
    return;
  }
  updateUserProfile(user);
}
function updateUserProfile(user) {
  document.getElementById('dashboard-username').textContent = user.name;
  document.getElementById('dashboard-email').textContent = user.email;
  document.getElementById('header-username').textContent = user.name;
}
function initDashboard() {
  loadContent(location.hash || '#dashboard');
  document.querySelector('.sidebar-toggle')?.addEventListener('click', toggleSidebar);
}
function setupEventListeners() {
  document.querySelectorAll('.nav-item a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const path = link.getAttribute('data-page');
      switchSection(path);
      loadContent(`#${path}`);
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      link.parentElement.classList.add('active');
      if (window.innerWidth < 992) toggleSidebar();
    });
  });

  document.querySelector('.logout-btn')?.addEventListener('click', () => {
    localStorage.clear();
    showToast('Logged out', 'success');
    setTimeout(() => switchSection('login'), 1000);
  });
}
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('active');
}
function loadContent(path) {
  const titles = {
    '#dashboard': 'Dashboard',
    '#profile': 'Profile',
    '#projects': 'Projects',
    '#messages': 'Messages',
    '#settings': 'Settings',
    '#help': 'Help'
  };
  document.querySelector('.page-title').textContent = titles[path] || 'Dashboard';
}
