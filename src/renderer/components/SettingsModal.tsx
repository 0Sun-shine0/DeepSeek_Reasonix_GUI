// SettingsModal — API key, model, budget, workspace

import { useState } from "react";
import type { Settings, SettingsPatch } from "../../shared/protocol.js";
import { useT } from "../locale.js";

type Props = { settings: Settings; onClose: () => void; onSave: (patch: SettingsPatch) => void; onOpenDirectory: () => Promise<string | null>; };

export function SettingsModal({ settings, onClose, onSave, onOpenDirectory }: Props) {
  const { t } = useT();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(settings.model);
  const [preset, setPreset] = useState(settings.preset);
  const [budgetStr, setBudgetStr] = useState(settings.budgetUsd != null ? String(settings.budgetUsd) : "");
  const [editMode, setEditMode] = useState(settings.editMode);

  const handleSave = () => {
    const patch: SettingsPatch = {};
    if (apiKey.trim()) patch.apiKey = apiKey.trim();
    if (model !== settings.model) patch.model = model;
    if (preset !== settings.preset) patch.preset = preset;
    const oldBudget = settings.budgetUsd != null ? String(settings.budgetUsd) : "";
    if (budgetStr !== oldBudget) patch.budgetUsd = budgetStr ? Number(budgetStr) : null;
    if (editMode !== settings.editMode) patch.editMode = editMode;
    onSave(patch);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h2>{t("settings_title")}</h2><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="settings-body">
          <div className="settings-field">
            <label>{t("settings_api_key")}</label>
            <div className="settings-key-row">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings.apiKeyPrefix ? `${settings.apiKeyPrefix}...` : "sk-..."}
              />
              <button
                className="settings-key-toggle"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? "🙈" : "👁"}
              </button>
            </div>
            <span className="settings-hint">{t("settings_api_hint")}</span>
          </div>
          <div className="settings-field"><label>{t("settings_model")}</label><input type="text" value={model} onChange={(e) => setModel(e.target.value)} /></div>
          <div className="settings-field"><label>{t("settings_preset")}</label><select value={preset} onChange={(e) => setPreset(e.target.value as "flash" | "pro")}><option value="flash">{t("settings_preset_flash")}</option><option value="pro">{t("settings_preset_pro")}</option></select></div>
          <div className="settings-field"><label>{t("settings_budget")}</label><input type="number" value={budgetStr} onChange={(e) => setBudgetStr(e.target.value)} placeholder="No limit" min="0" step="0.01" /></div>
          <div className="settings-field"><label>{t("settings_edit_mode")}</label><select value={editMode} onChange={(e) => setEditMode(e.target.value as "review" | "auto" | "yolo")}><option value="review">{t("settings_edit_review")}</option><option value="auto">{t("settings_edit_auto")}</option><option value="yolo">{t("settings_edit_yolo")}</option></select></div>
          <div className="settings-field"><label>{t("settings_workspace")}</label><div className="settings-workspace-row"><input type="text" value={settings.workspaceDir} disabled style={{ flex: 1 }} /><button className="approval-btn allow" style={{ fontSize: "11px", padding: "4px 10px" }} onClick={async () => { const dir = await onOpenDirectory(); if (dir) onSave({ workspaceDir: dir }); }}>{t("settings_browse")}</button></div></div>
          <div className="settings-field"><label>{t("settings_version")}</label><span>{settings.version}</span></div>
        </div>
        <div className="modal-footer"><button className="approval-btn deny" onClick={onClose}>{t("settings_cancel")}</button><button className="approval-btn allow" onClick={handleSave}>{t("settings_save")}</button></div>
      </div>
    </div>
  );
}
