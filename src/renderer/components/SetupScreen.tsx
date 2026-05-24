// SetupScreen — first-run API key prompt with whale

import { useState } from "react";
import { sendCommand } from "../protocol.js";
import { Whale } from "./Whale.js";
import { useT } from "../locale.js";

export function SetupScreen() {
  const { t } = useT();
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [whaleState, setWhaleState] = useState<"enter" | "idle">("enter");

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setSaving(true);
    setWhaleState("idle");
    sendCommand({ cmd: "setup_save_key", key: trimmed });
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-whale enter">
          <Whale state={whaleState} size={140} tooltip="🐋 Reasonix — DeepSeek-native" />
        </div>
        <h1>{t("setup_welcome")}</h1>
        <p>{t("setup_subtitle")}</p>
        <p className="setup-hint">
          {t("setup_hint_prefix")}
          <a href="https://platform.deepseek.com/api_keys" onClick={(e) => { e.preventDefault(); window.electronAPI.openExternal?.("https://platform.deepseek.com/api_keys"); }} rel="noreferrer">
            {t("setup_hint_link")}
          </a>
          {t("setup_hint_suffix")}
        </p>

        <div className="setup-field">
          <label>{t("setup_label")}</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={t("setup_placeholder")}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
        </div>

        <button
          className="setup-btn"
          onClick={handleSave}
          disabled={!key.trim() || saving}
        >
          {saving ? t("setup_saving") : t("setup_start")}
        </button>

        <p className="setup-note">{t("setup_note")}</p>
      </div>
    </div>
  );
}
