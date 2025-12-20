import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, FileText, Image, RefreshCw, Database, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useWeb3 } from "@/hooks/useWeb3";
import { ethers } from "ethers";
import nftAbi from "@/abi/SimpleMintOnlyNFT_abi.json"; // ABI 路径按你项目实际来

const Upload = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [authorizeRag, setAuthorizeRag] = useState(false);
  const [isReloadingVectorStore, setIsReloadingVectorStore] = useState(false);
  const [vectorStoreInfo, setVectorStoreInfo] = useState({
    loadedFiles: 0,
    vectorCount: 0,
    lastUpdated: null
  });
  
  // 🎯 修改：从 useWeb3 获取 provider 和 signer
  const { account, isConnected, provider } = useWeb3();

  // 🎯 修改后的 mintNFT 函数 - 使用 ZetaChain 兼容的 provider
  const mintNFT = async (tokenUri: string) => {
    console.log("🎬 开始执行 mintNFT 函数");
    console.log("📄 接收到的 tokenUri:", tokenUri);
    console.log("👛 当前账户:", account);
    console.log("🔗 Provider 状态:", provider ? "已连接" : "未连接");

    // 检查 provider 是否可用
    if (!provider) {
      console.error("❌ 未检测到钱包 provider");
      toast.error("请先连接钱包");
      return;
    }

    // 检查 tokenUri
    if (!tokenUri || tokenUri.trim() === "") {
      console.error("❌ Token URI 为空");
      toast.error("Token URI 无效，无法铸造 NFT");
      return;
    }

    try {
      console.log("🔗 连接钱包提供者...");
      
      // 🎯 使用从 useWeb3 获取的 provider 获取 signer
      let signer;
      try {
        signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();
        console.log("✅ 获取到签名者:", signerAddress);
        
        // 验证签名者地址是否匹配当前账户
        if (signerAddress.toLowerCase() !== account.toLowerCase()) {
          console.warn("⚠️ 签名者地址与当前账户不匹配");
          console.log("签名者地址:", signerAddress);
          console.log("当前账户:", account);
        }
      } catch (signerError) {
        console.error("❌ 获取签名者失败:", signerError);
        toast.error("请确认钱包已解锁并授权");
        return;
      }

      // 🎯 确保合约地址正确（ZetaChain 上的合约地址）
      // 注意：你需要确认这个地址是否部署在 ZetaChain 上
      const CONTRACT_ADDRESS = "0x7abbD946795CEf5Afc33DEb4f1b4DD59F534f7Ec";
      console.log("📝 合约地址:", CONTRACT_ADDRESS);
      console.log("📝 ABI 长度:", nftAbi.length);

      // 创建合约实例
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        nftAbi,
        signer
      );

      console.log("🔄 正在调用 mint 方法...");
      console.log("📤 参数: 账户 =", account, "tokenUri =", tokenUri);
      
      // 显示交易确认提示
      toast.info("请在钱包中确认交易", {
        duration: 10000,
      });

      try {
        // 调用合约的 mint 方法
        console.log("⏳ 发送交易请求...");
        const tx = await contract.mint(account, tokenUri);
        console.log("✅ 交易已发送，哈希:", tx.hash);
        
        // 显示交易哈希
        toast.info(`交易已发送，哈希: ${tx.hash.slice(0, 10)}...`, {
          duration: 8000,
        });

        // 等待交易确认
        console.log("⏳ 等待交易确认...");
        const receipt = await tx.wait();
        console.log("✅ 交易已确认，区块:", receipt.blockNumber);
        console.log("📊 交易详情:", receipt);

        // 提取 tokenId（根据你的合约事件结构调整）
        let tokenId = "未知";
        if (receipt.logs && receipt.logs.length > 0) {
          try {
            // 尝试解析事件日志
            const eventLog = receipt.logs[0];
            // 这里需要根据你的合约事件结构来解析
            // 假设你的 NFT 合约有一个 Transfer 事件，包含 tokenId
            // tokenId = eventLog.args.tokenId.toString();
            tokenId = "成功铸造"; // 简化处理
          } catch (logError) {
            console.warn("无法解析事件日志，但交易成功:", logError);
          }
        }

        console.log("🎉 NFT 铸造成功！Token ID:", tokenId);
        toast.success("NFT 铸造成功！");

        // 记录到后端
        try {
          await fetch("/api/nft_minted", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              wallet_address: account,
              contract_address: CONTRACT_ADDRESS,
              token_id: tokenId,
              token_uri: tokenUri,
              tx_hash: receipt.hash,
              network: "ZetaChain" // 🎯 添加网络信息
            }),
          });
          console.log("✅ NFT 信息已记录到后端");
        } catch (apiError) {
          console.warn("⚠️ 记录 NFT 信息到后端失败:", apiError);
          // 不阻止用户继续操作
        }

      } catch (txError: any) {
        console.error("❌ 交易失败:");
        console.error("错误代码:", txError.code);
        console.error("错误信息:", txError.message);
        console.error("完整错误:", txError);

        // 处理常见错误
        if (txError.code === 4001) {
          toast.error("用户拒绝了交易");
        } else if (txError.message.includes("insufficient funds")) {
          toast.error("Gas费用不足");
        } else if (txError.message.includes("network changed")) {
          toast.error("网络已切换，请重新连接");
        } else if (txError.message.includes("execution reverted")) {
          toast.error("合约执行失败，请检查参数");
        } else {
          toast.error(`NFT 铸造失败：${txError.message || "未知错误"}`);
        }
        throw txError; // 重新抛出错误，让上层处理
      }

    } catch (err: any) {
      console.error("❌ NFT 铸造过程失败:");
      console.error("错误信息:", err.message);
      console.error("错误详情:", err);
      
      // 不重复显示错误，上层已处理
      throw err;
    }
  };

  // 重新加载知识库
  const handleReloadVectorStore = async () => {
    setIsReloadingVectorStore(true);
    
    try {
      const response = await fetch('/api/reload_vector_store', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message || "知识库重新加载成功！");
        // 更新向量库信息
        setVectorStoreInfo({
          loadedFiles: result.loaded_files || 0,
          vectorCount: result.vector_count || 0,
          lastUpdated: new Date().toLocaleTimeString()
        });
      } else {
        toast.error(result.message || "重新加载知识库失败");
      }
    } catch (error) {
      console.error('重新加载知识库错误:', error);
      toast.error("重新加载知识库失败: " + (error as Error).message);
    } finally {
      setIsReloadingVectorStore(false);
    }
  };

  // 获取知识库信息
  const fetchVectorStoreInfo = async () => {
    try {
      const response = await fetch('/api/reload_vector_store', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setVectorStoreInfo({
            loadedFiles: result.loaded_files || 0,
            vectorCount: result.vector_count || 0,
            lastUpdated: new Date().toLocaleTimeString()
          });
        }
      }
    } catch (error) {
      console.error('获取知识库信息失败:', error);
    }
  };

  // 组件加载时获取知识库信息
  useState(() => {
    fetchVectorStoreInfo();
  });

  const handleUpload = async () => {
    if (!content || !title) {
      toast.error("请填写标题和内容");
      return;
    }

    // 🎯 检查钱包连接状态
    if (!isConnected || !account) {
      toast.error("请先连接钱包");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('wallet_address', account); 
      formData.append('filename', title);
      formData.append('content', content);
      formData.append('authorize_rag', authorizeRag.toString());

      console.log("📤 开始上传文件到后端...");
      const response = await fetch('/api/share', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('响应错误:', errorText);
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result = await response.json();
      console.log("📥 后端返回结果:", result);
      
      if (result.success) {
        toast.success(result.message || "文件分享成功！");

        const { token_uri, preview_url, file_id } = result;

        // 🎯 调试信息
        console.log("🎯 收到后端返回的数据:");
        console.log("token_uri:", token_uri);
        console.log("preview_url:", preview_url);
        console.log("file_id:", file_id);

        // 🎯 检查 token_uri 是否存在
        if (!token_uri) {
          console.error("❌ 错误: token_uri 为空或未定义!");
          toast.error("获取 Token URI 失败，无法铸造 NFT");
        } else {
          // 🎯 确保 token_uri 是字符串
          console.log("✅ 开始铸造 NFT，Token URI:", token_uri);
          try {
            await mintNFT(String(token_uri));
            toast.success("NFT 铸造完成！");
          } catch (mintError) {
            console.error("NFT 铸造失败:", mintError);
            // 不阻止后续操作，文件上传已成功
          }
        }

        // 清空表单
        setContent("");
        setTitle("");
        
        // 如果用户授权了RAG，重新加载知识库
        if (authorizeRag) {
          toast.info("内容已授权RAG，正在更新知识库...");
          handleReloadVectorStore();
        }
        
        setAuthorizeRag(false);
        
        if (result.file_id) {
          console.log('文件ID:', result.file_id);
          toast.info(`文件ID: ${result.file_id}`);
        }
      } else {
        console.error("上传失败:", result.message);
        toast.error(result.message || "上传失败");
      }
    } catch (error) {
      console.error('上传错误详情:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        checkBackendConnection();
      } else {
        toast.error("上传失败: " + (error as Error).message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // 辅助函数：检查后端连接
  const checkBackendConnection = async () => {
    try {
      const testResponse = await fetch('http://localhost:5001/', {
        method: 'GET',
      });
      
      if (testResponse.ok) {
        toast.error("后端服务正在运行，但代理配置可能有问题。请检查Vite代理配置。");
      } else {
        toast.error(`后端服务返回状态: ${testResponse.status}`);
      }
    } catch (testError) {
      console.error('后端连接测试失败:', testError);
      toast.error("无法连接到后端服务器。请确保后端服务正在5001端口运行。");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              上传您的内容
            </h1>
            <p className="text-muted-foreground text-lg">
              上传内容并铸造为 Data NFT，设置 AI 模型授权
            </p>
            
            {/* 🎯 添加钱包状态显示 */}
            <div className="mt-4">
              {isConnected ? (
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-sm">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  钱包已连接: {account.slice(0, 6)}...{account.slice(-4)}
                </div>
              ) : (
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-sm">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  请连接钱包以铸造 NFT
                </div>
              )}
            </div>
          </div>

          {/* 知识库状态卡片 */}
          <Card className="p-6 border-border/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">RAG知识库状态</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>📄 已加载文件: {vectorStoreInfo.loadedFiles}</span>
                    <span>🔢 文档块数量: {vectorStoreInfo.vectorCount}</span>
                    <span>🕐 最后更新: {vectorStoreInfo.lastUpdated || "从未"}</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleReloadVectorStore}
                disabled={isReloadingVectorStore}
                variant="outline"
                className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                {isReloadingVectorStore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    重新加载中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重新加载知识库
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-blue-600 dark:text-blue-400">
              <p>💡 知识库包含所有授权RAG的内容，用于AI模型的检索增强生成。上传新内容后，如果授权了RAG，记得重新加载知识库。</p>
            </div>
          </Card>

          <Card className="p-8 border-border/50 bg-gradient-card backdrop-blur-sm">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base">内容标题</Label>
                <Input
                  id="title"
                  placeholder="为您的内容起个标题..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-border/50 bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-base">内容详情</Label>
                <Textarea
                  id="content"
                  placeholder="输入您的内容，支持文本、链接等..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px] border-border/50 bg-background/50 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 p-4 border rounded-lg border-border/50 bg-background/30">
                <input
                  type="checkbox"
                  id="authorize-rag"
                  checked={authorizeRag}
                  onChange={(e) => setAuthorizeRag(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <Label htmlFor="authorize-rag" className="text-base cursor-pointer">
                  授权AI模型使用此内容进行RAG（检索增强生成）
                </Label>
                <div className="ml-auto text-sm text-muted-foreground">
                  {authorizeRag ? (
                    <span className="text-green-600">✅ 已授权 - 此内容将加入知识库</span>
                  ) : (
                    <span className="text-gray-500">❌ 未授权 - 此内容不会加入知识库</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-border/50 bg-background/30 cursor-pointer hover:border-primary/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">文本内容</h3>
                      <p className="text-sm text-muted-foreground">直接输入文本数据</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-border/50 bg-background/30 cursor-pointer hover:border-secondary/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Image className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">文件上传</h3>
                      <p className="text-sm text-muted-foreground">上传文档或图片</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !isConnected}
                  className="flex-1 shadow-glow-primary"
                  size="lg"
                >
                  <UploadIcon className="mr-2 h-5 w-5" />
                  {isUploading ? "上传中..." : 
                    !isConnected ? "请先连接钱包" : "上传并铸造 NFT"}
                </Button>
                
                <Button
                  onClick={handleReloadVectorStore}
                  disabled={isReloadingVectorStore}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  {isReloadingVectorStore ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      重新加载中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      仅重新加载知识库
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">📌 使用提示：</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>请确保钱包已连接到 ZetaChain 网络</li>
                  <li>上传内容后，系统会自动铸造 Data NFT</li>
                  <li>如果勾选了"授权AI模型使用此内容进行RAG"，系统会自动重新加载知识库</li>
                  <li>您也可以随时手动点击"重新加载知识库"按钮，更新AI模型的知识库</li>
                  <li>知识库包含所有授权RAG的内容，用于增强AI回答的准确性和相关性</li>
                  <li>未授权RAG的内容仍会保存，但不会用于AI模型的检索增强生成</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4">
              <div className="text-3xl font-bold text-primary mb-2">1</div>
              <p className="text-sm text-muted-foreground">上传内容到 IPFS</p>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-secondary mb-2">2</div>
              <p className="text-sm text-muted-foreground">铸造 Data NFT</p>
            </div>
            <div className="p-4">
              <div className="text-3xl font-bold text-accent mb-2">3</div>
              <p className="text-sm text-muted-foreground">设置 AI 授权</p>
            </div>
          </div>
          
          {/* 🎯 添加网络信息 */}
          <div className="mt-6 p-4 rounded-lg bg-card/30 border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              🔗 当前网络: ZetaChain | 请确保您的 MetaMask/钱包已切换到 ZetaChain 网络
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;