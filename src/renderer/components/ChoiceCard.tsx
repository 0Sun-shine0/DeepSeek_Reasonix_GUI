// ChoiceCard — model asks user to pick an option

import { useState } from "react";
import type { PendingChoice } from "../state.js";
import { useT } from "../locale.js";

type Props = { choice: PendingChoice; onPick: (optionId: string) => void; onPickText?: (text: string) => void; onCancel: () => void; };

export function ChoiceCard({ choice, onPick, onPickText, onCancel }: Props) {
  const { t } = useT();
  const [customText, setCustomText] = useState("");
  return (
    <div className="approval-card choice-card">
      <div className="approval-header"><span className="approval-icon">❓</span><span className="approval-title">{choice.question}</span></div>
      <div className="choice-options">
        {choice.options.map((opt) => (<button key={opt.id} className="choice-option" onClick={() => onPick(opt.id)}><span className="choice-option-title">{opt.title}</span>{opt.summary && <span className="choice-option-summary">{opt.summary}</span>}</button>))}
      </div>
      {choice.allowCustom && <div className="choice-custom"><input type="text" className="choice-custom-input" placeholder={t("choice_custom_placeholder")} value={customText} onChange={(e) => setCustomText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && customText.trim() && (onPickText ? onPickText(customText.trim()) : onPick(customText.trim()))} /><button className="choice-custom-btn" onClick={() => customText.trim() && (onPickText ? onPickText(customText.trim()) : onPick(customText.trim()))}>{t("choice_send")}</button></div>}
      <div className="approval-actions"><button className="approval-btn deny" onClick={onCancel}>{t("choice_cancel")}</button></div>
    </div>
  );
}
