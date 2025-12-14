import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { CHAIN_CONFIGS, Chain } from '@/lib/chains'

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState<string | null>(null)
  const [currentChain, setCurrentChain] = useState<Chain | null>(null)
  const [currentChainId, setCurrentChainId] = useState<string | null>(null)

  useEffect(() => {
    // 检查浏览器是否安装了 MetaMask
    if (typeof window !== 'undefined' && window.ethereum) {
      // 创建 provider
      const newProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(newProvider)

      // 检查是否已经连接
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setIsConnected(true)
          setAccount(accounts[0])
        }
      })

      // 获取当前链
      window.ethereum.request({ method: 'eth_chainId' }).then((chainId: string | bigint) => {
        // 确保chainId是字符串格式（十六进制）
        const chainIdStr = typeof chainId === 'bigint' 
          ? '0x' + chainId.toString(16) 
          : chainId
        console.log('🔍 获取当前链ID:', chainId, '转换为:', chainIdStr)
        setCurrentChainId(chainIdStr)
        // 根据chainId获取链名称
        console.log('📋 所有链配置:', CHAIN_CONFIGS)
        const chain = Object.keys(CHAIN_CONFIGS).find((key) => {
          const configChainId = CHAIN_CONFIGS[key as Chain].chainId
          console.log(`🔄 比较链ID - 配置: ${configChainId}, 当前: ${chainIdStr}`)
          return configChainId === chainIdStr
        }) as Chain | undefined
        console.log('✅ 匹配的链:', chain)
        setCurrentChain(chain || null)
      })

      // 监听账户变化
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsConnected(true)
          setAccount(accounts[0])
        } else {
          setIsConnected(false)
          setAccount(null)
        }
      })

      // 监听网络变化
      window.ethereum.on('chainChanged', (chainId: string | bigint) => {
        // 确保chainId是字符串格式（十六进制）
        const chainIdStr = typeof chainId === 'bigint' 
          ? '0x' + chainId.toString(16) 
          : chainId
        console.log('🔄 网络变化 - 新链ID:', chainId, '转换为:', chainIdStr)
        setCurrentChainId(chainIdStr)
        // 根据chainId获取链名称
        console.log('📋 所有链配置:', CHAIN_CONFIGS)
        const chain = Object.keys(CHAIN_CONFIGS).find((key) => {
          const configChainId = CHAIN_CONFIGS[key as Chain].chainId
          console.log(`🔄 比较链ID - 配置: ${configChainId}, 当前: ${chainIdStr}`)
          return configChainId === chainIdStr
        }) as Chain | undefined
        console.log('✅ 匹配的链:', chain)
        setCurrentChain(chain || null)
      })
    }
  }, [])

  // 连接钱包
  const connect = async () => {
    if (!provider || typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask 未安装')
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      // 连接成功后会触发 accountsChanged 事件，更新状态
      return true
    } catch (error) {
      console.error('连接钱包失败:', error)
      return false
    }
  }

  return {
    provider,
    isConnected,
    account,
    currentChain,
    currentChainId,
    connect
  }
}