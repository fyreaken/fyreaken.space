/*
  Fyreakenspace GitHub Pages Chat
  Corrected version.

  Before using:
  1. Put your Supabase Project URL below.
  2. Put your Supabase Publishable Key below.
*/

const SUPABASE_URL = "https://oawkxhgeaiqdqwedldvy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sLg6uRilzpKYK0lBlRB0Ug_8NPaEJvE";

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

const { createClient } = window.supabase;

const supabaseClient = configured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
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


/* -----------------------------
   General helpers
----------------------------- */

function errorText(text) {
  authError.textContent = text || "";
}


function requireConfig() {
  if (!configured) {
    alert(
      "This chat is not configured yet. Open app.js and enter your Supabase Project URL and Publishable Key."
    );

    return false;
  }

  return true;
}


/* -----------------------------
   User/profile functions
----------------------------- */

async function loadProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, username, is_admin")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Profile error:", error);
    return null;
  }

  return data;
}


function updateUI() {
  const logged = !!currentProfile;

  currentUser.textContent = logged
    ? `Logged in as ${currentProfile.username}`
    : "Not logged in";

  loginButton.textContent = logged
    ? "Logout"
    : "Login";

  messageInput.disabled = !logged;
  sendButton.disabled = !logged;

  messageInput.placeholder = logged
    ? "Type a message..."
    : "Log in to send a message...";
}


/* -----------------------------
   Admin availability
----------------------------- */

function renderStatus(available) {
  adminStatus.textContent = available
    ? "fyreakenspace online"
    : "fyreakenspace offline";

  adminStatus.className =
    `status ${available ? "online" : "offline"}`;
}


async function loadAvailability() {
  const { data, error } = await supabaseClient
    .from("site_settings")
    .select("admin_available")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Availability error:", error);
    renderStatus(false);
    return;
  }

  renderStatus(data?.admin_available ?? false);
}


/* -----------------------------
   Chat messages
----------------------------- */

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

  time.textContent =
    ` · ${new Date(row.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    })}`;


  el.append(
    name,
    text,
    time
  );


  messages.appendChild(el);

  messages.scrollTop = messages.scrollHeight;
}


async function loadMessages() {
  const { data, error } = await supabaseClient
    .from("messages")
    .select("id, username, message, created_at")
    .order("created_at", {
      ascending: true
    })
    .limit(200);

  if (error) {
    console.error("Messages error:", error);
    return;
  }

  messages.replaceChildren();

  data.forEach(addMessage);
}


/* -----------------------------
   Login / registration
----------------------------- */

function setAuthMode(newMode) {
  mode = newMode;

  authTitle.textContent =
    mode === "login"
      ? "Login"
      : "Create account";

  authDescription.textContent =
    mode === "login"
      ? "Log in to join the chat."
      : "Choose the username other people will see.";

  authSubmit.textContent =
    mode === "login"
      ? "Login"
      : "Create account";

  switchAuth.textContent =
    mode === "login"
      ? "Create an account instead"
      : "I already have an account";

  password.autocomplete =
    mode === "login"
      ? "current-password"
      : "new-password";

  errorText("");
}


async function openAuth() {
  if (!requireConfig()) {
    return;
  }

  errorText("");

  authForm.reset();

  setAuthMode("login");

  authDialog.showModal();

  username.focus();
}


/* -----------------------------
   Login button
----------------------------- */

loginButton.onclick = async () => {
  if (!requireConfig()) {
    return;
  }


  /* Logout */

  if (currentProfile) {
    await supabaseClient.auth.signOut();

    currentProfile = null;

    updateUI();

    return;
  }


  /* Login */

  openAuth();
};


/* -----------------------------
   Close login window
----------------------------- */

$("closeAuth").onclick = () => {
  authDialog.close();
};


/* -----------------------------
   Switch Login/Register
----------------------------- */

switchAuth.onclick = () => {
  setAuthMode(
    mode === "login"
      ? "register"
      : "login"
  );
};


/* -----------------------------
   Login/Register form
----------------------------- */

authForm.onsubmit = async event => {
  event.preventDefault();

  if (!requireConfig()) {
    return;
  }

  errorText("");


  const name = username.value.trim();

  const pass = password.value;


  /* Validate username */

  if (!/^[A-Za-z0-9_-]{2,24}$/.test(name)) {
    errorText(
      "Username must be 2–24 characters using letters, numbers, _ or -."
    );

    return;
  }


  /* Validate password */

  if (pass.length < 8) {
    errorText(
      "Password must be at least 8 characters."
    );

    return;
  }


  /*
    Supabase Auth requires an email-shaped identifier.

    We use the username internally while the username
    remains the name shown in chat.
  */

  const email =
    `${name.toLowerCase()}@chat.local`;


  /* -----------------------------
     Create account
  ----------------------------- */

  if (mode === "register") {

    const { data, error } =
      await supabaseClient.auth.signUp({
        email: email,
        password: pass,

        options: {
          data: {
            username: name
          }
        }
      });


    if (error) {
      console.error(
        "Signup error:",
        error
      );

      errorText(error.message);

      return;
    }


    if (!data.user) {
      errorText(
        "Account could not be created."
      );

      return;
    }


    alert(
      "Account created. You can now log in."
    );


    setAuthMode("login");

    password.value = "";

    return;
  }


  /* -----------------------------
     Login
  ----------------------------- */

  const { error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: pass
    });


  if (error) {
    console.error(
      "Login error:",
      error
    );

    errorText(
      "Invalid username or password."
    );

    return;
  }


  /* Get current session */

  const {
    data: sessionData
  } =
    await supabaseClient.auth.getSession();


  currentProfile =
    sessionData.session
      ? await loadProfile(
          sessionData.session.user.id
        )
      : null;


  if (!currentProfile) {

    errorText(
      "Login succeeded but the profile was not found."
    );

    return;
  }


  /* Close login window */

  authDialog.close();


  /* Update page */

  updateUI();


  /* Open admin controls */

  if (currentProfile.is_admin) {
    adminDialog.showModal();
  }
};


/* -----------------------------
   Send message
----------------------------- */

messageForm.onsubmit = async event => {
  event.preventDefault();


  if (!currentProfile) {
    return;
  }


  const message =
    messageInput.value.trim();


  if (!message) {
    return;
  }


  const { error } =
    await supabaseClient
      .from("messages")
      .insert({
        user_id: currentProfile.id,
        username: currentProfile.username,
        message: message
      });


  if (error) {

    console.error(
      "Send message error:",
      error
    );

    alert(error.message);

    return;
  }


  messageInput.value = "";
};


/* -----------------------------
   Admin: Online
----------------------------- */

$("onlineButton").onclick = async () => {

  if (!currentProfile?.is_admin) {
    return;
  }


  const { error } =
    await supabaseClient
      .from("site_settings")
      .update({
        admin_available: true
      })
      .eq("id", 1);


  if (error) {

    console.error(
      "Online status error:",
      error
    );

    alert(error.message);

    return;
  }


  adminDialog.close();
};


/* -----------------------------
   Admin: Offline
----------------------------- */

$("offlineButton").onclick = async () => {

  if (!currentProfile?.is_admin) {
    return;
  }


  const { error } =
    await supabaseClient
      .from("site_settings")
      .update({
        admin_available: false
      })
      .eq("id", 1);


  if (error) {

    console.error(
      "Offline status error:",
      error
    );

    alert(error.message);

    return;
  }


  adminDialog.close();
};


/* -----------------------------
   Close admin window
----------------------------- */

$("closeAdmin").onclick = () => {
  adminDialog.close();
};


/* -----------------------------
   Start application
----------------------------- */

async function start() {

  if (!configured) {

    renderStatus(false);

    return;
  }


  /* Check existing login */

  const { data } =
    await supabaseClient.auth.getSession();


  if (data.session) {

    currentProfile =
      await loadProfile(
        data.session.user.id
      );
  }


  updateUI();


  /* Load existing chat */

  await loadMessages();


  /* Load current admin status */

  await loadAvailability();


  /* -----------------------------
     Realtime chat
  ----------------------------- */

  supabaseClient
    .channel("chat-messages")

    .on(
      "postgres_changes",

      {
        event: "INSERT",
        schema: "public",
        table: "messages"
      },

      payload => {

        addMessage(
          payload.new
        );
      }
    )

    .subscribe(status => {

      if (status === "CHANNEL_ERROR") {

        console.error(
          "Could not establish realtime chat connection."
        );
      }
    });


  /* -----------------------------
     Realtime availability
  ----------------------------- */

  supabaseClient
    .channel("chat-settings")

    .on(
      "postgres_changes",

      {
        event: "UPDATE",
        schema: "public",
        table: "site_settings"
      },

      payload => {

        renderStatus(
          payload.new.admin_available
        );
      }
    )

    .subscribe(status => {

      if (status === "CHANNEL_ERROR") {

        console.error(
          "Could not establish realtime status connection."
        );
      }
    });


  /* -----------------------------
     Authentication state changes
  ----------------------------- */

  supabaseClient.auth.onAuthStateChange(
    async (_event, session) => {

      currentProfile =
        session
          ? await loadProfile(
              session.user.id
            )
          : null;


      updateUI();
    }
  );
}


/* Start */

start();