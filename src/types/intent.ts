/**
 * SimpleDemo - 精简的意图类型定义
 * 支持：
 * 1. ZETA 链内转账
 * 2. ZETA 跨链转账 (ZetaChain -> BSC)
 * 3. 跨链 TalkToEarn (Any Chain -> ZetaChain)
 */

export type Chain = 'zetachain' | 'bsc' | 'mumbai' | 'sepolia' // 可以根据需要扩展

export type ActionType = 
  | 'transfer'              // 链内转账
  | 'cross_chain_transfer' // 跨链转账
  | 'cross_chain_talk'     // 跨链 TalkToEarn 消息

export interface Intent {
  action: ActionType
  fromChain?: Chain
  toChain?: Chain
  fromToken?: string        
  toToken?: string          
  amount?: string
  recipient?: string
  message?: string          // 新增：用于 TalkToEarn 的消息内容
  additionalParams?: Record<string, unknown>
}

export interface LLMResponse {
  intent: Intent
  confidence: number
  reasoning?: string
}