// Runtime JSON schema validators for IPC and outgoing commands
import Ajv from "ajv";
import { isAbsolute, resolve } from "path";

const ajv = new Ajv({ allErrors: true });

// Basic schemas for outgoing commands (discriminated by `cmd`)
const userInputSchema = {
  type: "object",
  properties: { cmd: { const: "user_input" }, text: { type: "string", minLength: 1, maxLength: 10000 } },
  required: ["cmd", "text"],
  additionalProperties: false,
};

const abortSchema = { type: "object", properties: { cmd: { const: "abort" } }, required: ["cmd"], additionalProperties: false };

const confirmResponseSchema = {
  type: "object",
  properties: {
    cmd: { const: "confirm_response" },
    id: { type: "number" },
    response: { type: "object", properties: { type: { type: "string" } }, required: ["type"] },
  },
  required: ["cmd", "id", "response"],
  additionalProperties: false,
};

const choiceResponseSchema = {
  type: "object",
  properties: {
    cmd: { const: "choice_response" },
    id: { type: "number" },
    response: { type: "object", properties: { type: { type: "string" } }, required: ["type"] },
  },
  required: ["cmd", "id", "response"],
  additionalProperties: false,
};

const planResponseSchema = {
  type: "object",
  properties: { cmd: { const: "plan_response" }, id: { type: "number" }, response: { type: "object", properties: { type: { type: "string" } }, required: ["type"] } },
  required: ["cmd", "id", "response"],
  additionalProperties: false,
};

const checkpointResponseSchema = {
  type: "object",
  properties: { cmd: { const: "checkpoint_response" }, id: { type: "number" }, response: { type: "object", properties: { type: { type: "string" } }, required: ["type"] } },
  required: ["cmd", "id", "response"],
  additionalProperties: false,
};

const revisionResponseSchema = {
  type: "object",
  properties: { cmd: { const: "revision_response" }, id: { type: "number" }, response: { type: "object", properties: { type: { type: "string" } }, required: ["type"] } },
  required: ["cmd", "id", "response"],
  additionalProperties: false,
};

const outgoingSchema = {
  oneOf: [userInputSchema, abortSchema, confirmResponseSchema, choiceResponseSchema, planResponseSchema, checkpointResponseSchema, revisionResponseSchema],
};

const validateOutgoing = ajv.compile(outgoingSchema as any);

export function validateOutgoingCommand(cmd: any): boolean {
  try {
    const ok = validateOutgoing(cmd);
    return Boolean(ok);
  } catch {
    return false;
  }
}

export function validateWorkspaceDir(ws: any): boolean {
  if (!ws || typeof ws !== "string") return false;
  if (ws.length === 0 || ws.length > 2600) return false;
  if (ws.includes("\0")) return false;
  // Reject path traversal indicators
  if (ws.includes("..")) return false;
  try { return isAbsolute(ws); } catch { return false; }
}

export function validateNotepadName(name: any): boolean {
  if (!name || typeof name !== "string") return false;
  if (name.length === 0 || name.length > 200) return false;
  // allowed: letters, numbers, space, - _ .
  return /^[\w\- .]+$/.test(name);
}

export function validatePathAbsolute(p: any): boolean {
  if (!p || typeof p !== 'string') return false;
  if (p.length > 2600) return false;
  try {
    return isAbsolute(p);
  } catch {
    return false;
  }
}

export function validatePathWithinWorkspace(p: any, ws: any): boolean {
  if (!validatePathAbsolute(p) || !validateWorkspaceDir(ws)) return false;
  try {
    const resolvedP = require('path').resolve(p);
    const resolvedWs = require('path').resolve(ws);
    const rel = require('path').relative(resolvedWs, resolvedP).replace(/\\/g, '/');
    return rel !== '' && !rel.startsWith('..') && !require('path').isAbsolute(rel) ? true : !rel.startsWith('..');
  } catch {
    return false;
  }
}

export function validateSearchQuery(q: any): boolean {
  if (q == null) return false;
  if (typeof q !== 'string') return false;
  const s = q.trim();
  return s.length > 0 && s.length <= 200;
}
