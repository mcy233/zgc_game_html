/**
 * LLM 通信层 —— 兼容 OpenAI Chat Completions 格式
 *
 * 支持绝大多数主流 API 提供商（OpenAI / DeepSeek / Qwen / Gemini OpenAI-compat / 本地 Ollama 等）
 * 配置持久化到 localStorage，不计入 GameState。
 */

const STORAGE_KEY = 'zgc_llm_config';
const TOKEN_STATS_KEY = 'zgc_llm_token_stats';

/* ================================================================== */
/*  配置                                                               */
/* ================================================================== */

export interface LLMConfig {
  enabled: boolean;
  apiKey: string;
  /** 例如 https://api.openai.com/v1  或  https://api.deepseek.com/v1 */
  baseUrl: string;
  /** 模型名，如 gpt-4o-mini / deepseek-chat / qwen-turbo 等 */
  model: string;
}

const DEFAULT_CONFIG: LLMConfig = {
  enabled: false,
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
};

export function getLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function setLLMConfig(patch: Partial<LLMConfig>): LLMConfig {
  const cur = getLLMConfig();
  const next = { ...cur, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isLLMReady(): boolean {
  const c = getLLMConfig();
  return c.enabled && !!c.apiKey && !!c.baseUrl && !!c.model;
}

/* ================================================================== */
/*  Token 用量统计                                                     */
/* ================================================================== */

export type TokenSource =
  | 'advisorFeedback' | 'randomEvent' | 'momentContent' | 'externalMoment'
  | 'actionDesc' | 'selfRegulation' | 'interaction' | 'misconductLine' | 'experimentWeakLine' | 'paperReview' | 'profileContent'
  | 'test' | 'other';

export interface TokenRecord {
  source: TokenSource;
  promptTokens: number;
  completionTokens: number;
  timestamp: number;
}

export interface TokenStats {
  records: TokenRecord[];
  totalPrompt: number;
  totalCompletion: number;
}

export function getTokenStats(): TokenStats {
  try {
    const raw = localStorage.getItem(TOKEN_STATS_KEY);
    if (!raw) return { records: [], totalPrompt: 0, totalCompletion: 0 };
    return JSON.parse(raw) as TokenStats;
  } catch {
    return { records: [], totalPrompt: 0, totalCompletion: 0 };
  }
}

function pushTokenRecord(source: TokenSource, promptTokens: number, completionTokens: number) {
  const stats = getTokenStats();
  stats.records.push({ source, promptTokens, completionTokens, timestamp: Date.now() });
  stats.totalPrompt += promptTokens;
  stats.totalCompletion += completionTokens;
  if (stats.records.length > 500) stats.records = stats.records.slice(-500);
  localStorage.setItem(TOKEN_STATS_KEY, JSON.stringify(stats));
}

export function clearTokenStats() {
  localStorage.removeItem(TOKEN_STATS_KEY);
}

/* ================================================================== */
/*  推理模型识别 —— 仅用于 UI 标记 + system prompt 注入                 */
/* ================================================================== */

const THINKING_MODEL_PATTERNS = [
  /\br1\b/i, /\br1-/i, /-r1$/i, /-r1-/i,
  /\bqwq\b/i,
  /thinking/i, /reasoner/i,
  /\bo[134]\b/i, /\bo[134]-/i,
  /deepseek-r/i,
  /glm-4\.\d/i, /glm-5/i,
  /kimi-k\d/i,
  /mimo/i,
  /minimax-m2/i,
  /qwen3/i,
  /gpt-5(?!\.\d+-(?:mini|nano))/i,  // gpt-5 系列（但排除 mini/nano 轻量版）
];

/** 判断模型名是否可能默认启用思维链 */
export function isThinkingModel(modelId: string): boolean {
  return THINKING_MODEL_PATTERNS.some((p) => p.test(modelId));
}

/* ================================================================== */
/*  模型列表                                                           */
/* ================================================================== */

export interface ModelInfo {
  id: string;
  owned_by?: string;
  isThinking?: boolean;
}

export async function fetchAvailableModels(): Promise<ModelInfo[]> {
  const cfg = getLLMConfig();
  if (!cfg.apiKey || !cfg.baseUrl) throw new Error('请先填写 API Key 和 Base URL');

  const base = cfg.baseUrl.replace(/\/+$/, '');
  const url = `${base}/models`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${res.status}: ${body.slice(0, 150)}`);
    }
    const json = await res.json();
    const raw: ModelInfo[] = (json?.data ?? json ?? []) as ModelInfo[];
    return raw
      .filter((m) => m.id)
      .map((m) => ({ ...m, isThinking: isThinkingModel(m.id) }))
      .sort((a, b) => {
        if (a.isThinking !== b.isThinking) return a.isThinking ? 1 : -1;
        return a.id.localeCompare(b.id);
      });
  } finally {
    clearTimeout(timer);
  }
}

/* ================================================================== */
/*  Chat Completions                                                   */
/* ================================================================== */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * 调用 OpenAI-compatible chat completions 端点，返回 assistant 文本。
 *
 * 关键策略：
 * 1. 所有请求均发送 enable_thinking:false（对非推理模型无害）
 * 2. 推理模型的 system prompt 注入 /no_think 指令
 * 3. max_tokens 留足预算（部分 relay 将 reasoning 也计入 max_tokens）
 * 4. 提取 content 时多层 fallback：content → reasoning_content → reasoning
 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts?: { temperature?: number; maxTokens?: number; source?: TokenSource },
): Promise<string> {
  const cfg = getLLMConfig();
  if (!cfg.enabled || !cfg.apiKey) throw new Error('LLM not configured');

  const base = cfg.baseUrl.replace(/\/+$/, '');
  const url = `${base}/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  const thinking = isThinkingModel(cfg.model);
  const finalMessages = thinking ? disableThinkingInMessages(messages) : messages;

  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: finalMessages,
    temperature: opts?.temperature ?? 0.9,
    max_tokens: opts?.maxTokens ?? 2048,
    // 统一发送：对非推理模型无害，对推理模型有抑制效果
    enable_thinking: false,
    enable_search: false,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LLM API ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json();

    // 记录 token 用量
    const usage = data?.usage;
    if (usage) {
      const pt = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens
        : typeof usage.promptTokens === 'number' ? usage.promptTokens : 0;
      const ct = typeof usage.completion_tokens === 'number' ? usage.completion_tokens
        : typeof usage.completionTokens === 'number' ? usage.completionTokens : 0;
      pushTokenRecord(opts?.source ?? 'other', pt, ct);
    }

    const msg = data?.choices?.[0]?.message;

    // 多层 fallback 提取文本
    const text: string =
      msg?.content                              // OpenAI 标准 / 非推理模型
      || msg?.reasoning_content                 // GLM 推理模型
      || msg?.reasoning                         // relay / DeepSeek / MiniMax / Qwen 等
      || data?.choices?.[0]?.text               // 旧版 completions
      || data?.result                           // 部分国产 API
      || data?.output?.text                     // 通义千问
      || data?.response                         // 部分代理
      || '';

    if (!text) {
      const preview = JSON.stringify(data).slice(0, 300);
      throw new Error(`LLM 返回内容为空，原始响应: ${preview}`);
    }
    return typeof text === 'string' ? text.trim() : String(text).trim();
  } finally {
    clearTimeout(timer);
  }
}

function disableThinkingInMessages(messages: ChatMessage[]): ChatMessage[] {
  const NO_THINK_PREFIX = '【重要】请直接输出最终结果，不要输出任何思考过程、推理步骤或内心独白。回答要简短精炼。\n\n/no_think\n\n';
  return messages.map((m) => {
    if (m.role === 'system') return { ...m, content: NO_THINK_PREFIX + m.content };
    return m;
  });
}

/** 尝试从 LLM 返回文本中提取第一个 JSON 对象/数组 */
export function extractJSON<T = unknown>(text: string): T {
  const m = text.match(/[\[{][\s\S]*[\]}]/);
  if (!m) throw new Error('No JSON found in LLM response');
  return JSON.parse(m[0]) as T;
}
