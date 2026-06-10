import { llmParser } from './llmParser';
import { ruleParser } from './ruleParser';
import type { ParseResult } from './types';

export type { ParseResult } from './types';

/**
 * Hybrid parser — the best of both worlds.
 *
 * 1. Try the LLM (understands anything, handles typos, creative phrasing)
 * 2. If LLM fails (no internet, API error, no key), fall back to rules
 *
 * The rest of the app never knows which one answered — it just gets
 * a ParseResult either way.
 */
export async function parse(input: string): Promise<ParseResult> {
  try {
    const result = await llmParser.parse(input);
    console.log('[parser] LLM succeeded:', result.kind);
    return result;
  } catch (e) {
    console.log('[parser] LLM failed, using rules:', (e as Error).message);
    return ruleParser.parse(input);
  }
}
