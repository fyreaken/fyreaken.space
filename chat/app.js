/*
  BEFORE USING:
  1. Create a Supabase project.
  2. Run setup.sql in Supabase SQL Editor.
  3. Put your Supabase Project URL and Publishable Key below.
*/
const SUPABASE_URL = "https://oawkxhgeaiqdqwedldvy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sLg6uRilzpKYK0lBlRB0Ug_8NPaEJvE";

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

const { createClient } = window.supabase;
const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null;

const $ = id => document.getElementById(id);
const messages = $("messages");
const loginButton = $("loginButton");
const currentUser = $("currentUser");
const messageForm = $("messageForm");
const messageInput = $("messageInput");
const sendButton = $("sendButton");
const adminStatus = $("adminStatus");

const authDialog = $("authDialog");
const authForm = $("authForm");
const authTitle = $("authTitle");
const authDescription = $("authDescription");
const authSubmit = $("authSubmit");
const switchAuth = $("switchAuth");
const authError = $("authError");
const username = $("username");
const password = $("password");

const adminDialog = $("adminDialog");
let mode = "login";
let currentProfile = null;

function errorText(text){ authError.textContent = text || ""; }

function requireConfig() {
  if (!configured) {
    alert("This chat is not configured yet. Open app.js and enter your Supabase Project URL and Publishable Key.");
    return false;
  }
  return true;
}

async function loadProfile(userId) {
  const { data, error } = await supabase
    .from("profiles").select("id, username, is_admin").eq("id", userId).single();
  if (error) return null;
  return data;
}

function updateUI() {
  const logged = !!currentProfile;
  currentUser.textContent = logged ? `Logged in as ${currentProfile.username}` : "Not logged in";
  loginButton.textContent = logged ? "Logout" : "Login";
  messageInput.disabled = !logged;
  sendButton.disabled = !logged;
  messageInput.placeholder = logged ? "Type a message..." : "Log in to send a message...";
}

function renderStatus(available) {
  adminStatus.textContent = available ? "fyreakenspace online" : "fyreakenspace offline";
  adminStatus.className = `status ${available ? "online" : "offline"}`;
}

function addMessage(row) {
  const el = document.createElement("div");
  el.className = "message";
  const name = document.createElement("span");
  name.className = "name";
  name.textContent = row.username;
  const text = document.createElement("span");
  text.textContent = row.message;
  const time = document.createElement("span");
  time.className = "time";
  time.textContent = ` · ${new Date(row.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
  el.append(name,text,time);
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

async function loadMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("id, username, message, created_at")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) { console.error(error); return; }
  messages.replaceChildren();
  data.forEach(addMessage);
}

async function loadAvailability() {
  const { data } = await supabase.from("site_settings")
    .select("admin_available").eq("id", 1).single();
  renderStatus(data?.admin_available ?? false);
}

async function openAuth() {
  if (!requireConfig()) return;
  errorText("");
  authForm.reset();
  authDialog.showModal();
  username.focus();
}

loginButton.onclick = async () => {
  if (!requireConfig()) return;
  if (currentProfile) {
    await supabase.auth.signOut();
    currentProfile = null;
    updateUI();
  } else {
    openAuth();
  }
};

$("closeAuth").onclick = () => authDialog.close();

switchAuth.onclick = () => {
  mode = mode === "login" ? "register" : "login";
  authTitle.textContent = mode === "login" ? "Login" : "Create account";
  authDescription.textContent = mode === "login" ? "Log in to join the chat." : "Choose the username other people will see.";
  authSubmit.textContent = mode === "login" ? "Login" : "Create account";
  switchAuth.textContent = mode === "login" ? "Create an account instead" : "I already have an account";
  password.autocomplete = mode === "login" ? "current-password" : "new-password";
  errorText("");
};

authForm.onsubmit = async e => {
  e.preventDefault();
  if (!requireConfig()) return;
  errorText("");

  const name = username.value.trim();
  const pass = password.value;

  if (!/^[A-Za-z0-9_-]{2,24}$/.test(name)) {
    errorText("Username must be 2–24 characters using letters, numbers, _ or -.");
    return;
  }

  if (mode === "register") {
    const email = `${name.toLowerCase()}@chat.local`;
    const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { username: name } }});
    if (error) { errorText(error.message); return; }

    // Email confirmation must be disabled in Supabase for this username-only login design.
    if (!data.user) { errorText("Account could not be created."); return; }
    alert("Account created. You can now log in.");
    mode = "login";
    authTitle.textContent = "Login";
    authDescription.textContent = "Log in to join the chat.";
    authSubmit.textContent = "Login";
    switchAuth.textContent = "Create an account instead";
    password.value = "";
    return;
  }

  const email = `${name.toLowerCase()}@chat.local`;
  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) { errorText("Invalid username or password."); return; }

  const { data: sessionData } = await supabase.auth.getSession();
  currentProfile = sessionData.session ? await loadProfile(sessionData.session.user.id) : null;
  if (!currentProfile) { errorText("Login succeeded but the profile was not found."); return; }

  authDialog.close();
  updateUI();
  if (currentProfile.is_admin) adminDialog.showModal();
};

messageForm.onsubmit = async e => {
  e.preventDefault();
  if (!currentProfile) return;
  const message = messageInput.value.trim();
  if (!message) return;

  const { error } = await supabase.from("messages").insert({
    user_id: currentProfile.id,
    username: currentProfile.username,
    message
  });
  if (error) alert(error.message);
  else messageInput.value = "";
};

$("onlineButton").onclick = async () => {
  const { error } = await supabase.from("site_settings")
    .update({ admin_available: true }).eq("id", 1);
  if (!error) adminDialog.close();
};

$("offlineButton").onclick = async () => {
  const { error } = await supabase.from("site_settings")
    .update({ admin_available: false }).eq("id", 1);
  if (!error) adminDialog.close();
};

$("closeAdmin").onclick = () => adminDialog.close();

async function start() {
  if (!configured) {
    renderStatus(false);
    return;
  }

  const { data } = await supabase.auth.getSession();
  if (data.session) currentProfile = await loadProfile(data.session.user.id);
  updateUI();
  await loadMessages();
  await loadAvailability();

  supabase.channel("chat-messages")
    .on("postgres_changes", {event:"INSERT", schema:"public", table:"messages"}, payload => {
      addMessage(payload.new);
    }).subscribe();

  supabase.channel("chat-settings")
    .on("postgres_changes", {event:"UPDATE", schema:"public", table:"site_settings"}, payload => {
      renderStatus(payload.new.admin_available);
    }).subscribe();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentProfile = session ? await loadProfile(session.user.id) : null;
    updateUI();
  });
}

start();