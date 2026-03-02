var currentStatus = null;

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

function onLoad() {
  registerPluginActions({
    openStatusPicker: function () {
      simpleChat.api.showModal({
        title: "Set your status",
        options: statuses,
        callback: "applyStatus"
      });
    },

    applyStatus: function (value) {
      currentStatus = statusByValue(value);
      if (currentStatus) {
        simpleChat.api.updateChatMessageFont({
          color: currentStatus.color
        });
        sendToFlutter({
          type: "showSnackbar",
          message: "Status: " + currentStatus.label
        });
      }
    },

    clearStatus: function () {
      currentStatus = null;
      simpleChat.api.updateChatMessageFont({
        color: "#222222"
      });
      sendToFlutter({
        type: "showSnackbar",
        message: "Status cleared"
      });
    },

    showStatus: function () {
      var msg = currentStatus
        ? "Current status: " + currentStatus.label
        : "No status set";
      sendToFlutter({
        type: "showSnackbar",
        message: msg
      });
    }
  });

  return {
    name: "Status",
    version: "1.0.0",
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
          label: "Show Current Status",
          icon: "info",
          action: "showStatus"
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