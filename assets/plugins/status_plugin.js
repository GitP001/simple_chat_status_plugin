var STATUS_API = "http://10.0.2.2:3001";

// state
var currentStatus = null;
var currentUserId = null;

var statuses = [
  { label: "🟢 Online",         value: "online",   color: "#4CAF50" },
  { label: "😴 Away",           value: "away",     color: "#FF9800" },
  { label: "🔴 Do Not Disturb", value: "dnd",      color: "#F44336" },
  { label: "📚 Studying",       value: "studying", color: "#2196F3" },
  { label: "🎮 Gaming",         value: "gaming",   color: "#9C27B0" },
  { label: "💼 Working",        value: "working",  color: "#607D8B" }
];

function statusByValue(val) {
  for (var i = 0; i < statuses.length; i++) {
    if (statuses[i].value === val) return statuses[i];
  }
  return null;
}

async function saveStatus(userId, status) {
  try {
    await simpleChat.api.httpRequest(
      STATUS_API + "/status/" + userId,
      "PUT",
      { value: status.value, label: status.label, color: status.color },
      { "Content-Type": "application/json" }
    );
  } catch (e) {
    sendToFlutter({ type: "showSnackbar", message: "Failed to save status" });
  }
}

async function loadMyStatus(userId) {
  try {
    var resp = await simpleChat.api.httpRequest(
      STATUS_API + "/status/" + userId,
      "GET"
    );
    if (resp && resp.value) {
      currentStatus = statusByValue(resp.value);
      if (currentStatus) {
        simpleChat.api.updateChatMessageFont({ color: currentStatus.color });
      }
    }
  } catch (e) {
  }
}

async function deleteStatus(userId) {
  try {
    await simpleChat.api.httpRequest(
      STATUS_API + "/status/" + userId,
      "DELETE"
    );
  } catch (e) {
    // Ignore
  }
}

async function fetchAllStatuses() {
  try {
    var resp = await simpleChat.api.httpRequest(
      STATUS_API + "/statuses",
      "GET"
    );
    return resp || [];
  } catch (e) {
    sendToFlutter({ type: "showSnackbar", message: "Failed to load statuses" });
    return [];
  }
}

// Actions

function openStatusPicker() {
  simpleChat.api.showModal({
    title: "Set your status",
    options: statuses,
    callback: "applyStatus"
  });
}

async function applyStatus(value) {
  var status = statusByValue(value);
  if (!status) return;

  currentStatus = status;

  // Visual feedback
  simpleChat.api.updateChatMessageFont({ color: status.color });
  sendToFlutter({ type: "showSnackbar", message: "Status: " + status.label });

  // Persist to backend
  if (currentUserId) {
    await saveStatus(currentUserId, status);
  }
}

async function clearStatus() {
  currentStatus = null;
  simpleChat.api.updateChatMessageFont({ color: "#222222" });
  sendToFlutter({ type: "showSnackbar", message: "Status cleared" });

  if (currentUserId) {
    await deleteStatus(currentUserId);
  }
}

function showCurrentStatus() {
  var msg = currentStatus
    ? "Current status: " + currentStatus.label
    : "No status set";
  sendToFlutter({ type: "showSnackbar", message: msg });
}

async function viewAllStatuses() {
  var all = await fetchAllStatuses();
  if (!all || all.length === 0) {
    sendToFlutter({ type: "showSnackbar", message: "No one has set a status" });
    return;
  }

  var options = [];
  for (var i = 0; i < all.length; i++) {
    var s = all[i];
    options.push({
      label: (s.label || s.value) + "  —  " + s.userId,
      value: s.userId
    });
  }

  simpleChat.api.showModal({
    title: "Everyone's Status",
    options: options,
    callback: "onViewStatusSelect"
  });
}

function onViewStatusSelect() {
}

// Plugin entry point

function onLoad() {
  currentUserId = "default_user";

  registerPluginActions({
    openStatusPicker:   openStatusPicker,
    applyStatus:        applyStatus,
    clearStatus:        clearStatus,
    showStatus:         showCurrentStatus,
    viewAllStatuses:    viewAllStatuses,
    onViewStatusSelect: onViewStatusSelect
  });

  return {
    name: "Status",
    version: "1.1.0",
    ui: {
      toolbarButtons: [
        {
          id: "status-picker-btn",
          label: "Status",
          icon: "circle",
          action: "openStatusPicker"
        }
      ],
      components: [
        {
          type: "label",
          id: "status-title",
          text: "My Status",
          variant: "title"
        },
        {
          type: "dropdown",
          id: "status-select",
          label: "Set your status",
          options: [
            { label: "🟢 Online",         value: "online" },
            { label: "😴 Away",           value: "away" },
            { label: "🔴 Do Not Disturb", value: "dnd" },
            { label: "📚 Studying",       value: "studying" },
            { label: "🎮 Gaming",         value: "gaming" },
            { label: "💼 Working",        value: "working" }
          ],
          action: "openStatusPicker"
        },
        {
          type: "button",
          id: "status-show-btn",
          label: "Show My Status",
          icon: "info",
          action: "showStatus"
        },
        {
          type: "button",
          id: "status-view-all-btn",
          label: "View All Statuses",
          icon: "group",
          action: "viewAllStatuses"
        },
        {
          type: "button",
          id: "status-clear-btn",
          label: "Clear Status",
          icon: "clear",
          action: "clearStatus"
        }
      ]
    },
    messages: ["Status plugin loaded!"]
  };
}