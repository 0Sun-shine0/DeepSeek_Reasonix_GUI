// Whale.tsx — Reasonix mascot: animated SVG whale with state-driven behavior

type WhaleState = "idle" | "busy" | "error" | "enter";

type Props = {
  state: WhaleState;
  size?: number; // width in px, height auto-calculated
  showBubble?: boolean;
  tooltip?: string;
};

export function Whale({ state, size = 60, showBubble = false, tooltip }: Props) {
  const height = size * 0.55;
  const color = state === "error" ? "#f7768e" : state === "busy" ? "#7aa2f7" : "#9ece6a";

  return (
    <div className={`whale-container ${state}`}>
      <svg
        className={`whale-svg ${state === "enter" ? "enter" : ""}`}
        width={size}
        height={height}
        viewBox="0 0 200 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Body */}
        <ellipse cx="100" cy="55" rx="75" ry="40" fill={color} opacity="0.9" />
        {/* Belly */}
        <ellipse cx="105" cy="65" rx="55" ry="25" fill="white" opacity="0.15" />
        {/* Tail */}
        <path
          d="M175 55 Q195 25 190 20 Q185 35 175 45 Q185 30 190 50 Q175 45 175 55 Z"
          fill={color}
          opacity="0.8"
        />
        {/* Tail fin */}
        <path
          d="M185 20 Q200 5 195 15 Q190 25 185 20 Z"
          fill={color}
          opacity="0.7"
        />
        {/* Eye */}
        <circle cx="60" cy="48" r="6" fill="white" />
        <circle cx="58" cy="47" r="3" fill="#1a1b26" />
        {/* Pupil glint */}
        <circle cx="57" cy="45" r="1" fill="white" />
        {/* Smile / expression */}
        {state === "error" ? (
          <path d="M55 62 Q60 58 65 62" stroke="#1a1b26" strokeWidth="2" fill="none" />
        ) : (
          <path d="M52 60 Q58 68 64 60" stroke="#1a1b26" strokeWidth="2" fill="none" />
        )}
        {/* Flipper */}
        <ellipse cx="100" cy="70" rx="20" ry="8" fill={color} opacity="0.6" />
        {/* Water spout (busy only) */}
        {state === "busy" && (
          <>
            <circle cx="90" cy="15" r="3" fill={color} opacity="0.6">
              <animate attributeName="cy" values="15;0;15" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0;0.6" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="95" cy="10" r="2.5" fill={color} opacity="0.5">
              <animate attributeName="cy" values="10;-5;10" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="85" cy="12" r="2" fill={color} opacity="0.4">
              <animate attributeName="cy" values="12;2;12" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur="0.9s" repeatCount="indefinite" />
            </circle>
          </>
        )}
        {/* Bubbles (idle only) */}
        {state === "idle" && (
          <>
            <circle cx="50" cy="25" r="3" fill="white" opacity="0.3">
              <animate attributeName="cy" values="25;15;5" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="45" cy="30" r="2" fill="white" opacity="0.25">
              <animate attributeName="cy" values="30;20;8" dur="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.25;0.08;0" dur="3.5s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
      {showBubble && state === "busy" && (
        <div className="whale-bubble">Working...</div>
      )}
      {tooltip && (
        <div className="whale-tooltip">{tooltip}</div>
      )}
    </div>
  );
}
