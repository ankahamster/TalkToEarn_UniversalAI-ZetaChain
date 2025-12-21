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
  const { account, isConnected } = useWeb3();


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
      toast.error("重新加载知识库失败: " + error.message);
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

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('wallet_address', account); 
      formData.append('filename', title);
      formData.append('content', content);
      formData.append('authorize_rag', authorizeRag.toString());

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
      
      if (result.success) {
        toast.success(result.message || "文件分享成功！");
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
        toast.error(result.message || "上传失败");
        if (result.message.includes('登录')) {
          console.log('需要重新登录');
        }
      }
    } catch (error) {
      console.error('上传错误详情:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        checkBackendConnection();
      } else {
        toast.error("上传失败: " + error.message);
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
                className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-300"
              >
                {isReloadingVectorStore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    重新加载中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 text-blue-700 dark:text-blue-300" />
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
                  disabled={isUploading}
                  className="flex-1 shadow-glow-primary"
                  size="lg"
                >
                  <UploadIcon className="mr-2 h-5 w-5" />
                  {isUploading ? "上传中..." : "上传并铸造 NFT"}
                </Button>
                
                <Button
                onClick={handleReloadVectorStore}
                disabled={isReloadingVectorStore}
                variant="outline"
                className="flex-1 text-blue-700 dark:text-blue-300"
                size="lg"
              >
                {isReloadingVectorStore ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    重新加载中...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 text-blue-700 dark:text-blue-300" />
                    仅重新加载知识库
                  </>
                )}
              </Button>
              </div>
              
              <div className="text-sm text-muted-foreground p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">📌 使用提示：</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>上传内容后，如果勾选了"授权AI模型使用此内容进行RAG"，系统会自动重新加载知识库</li>
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
        </div>
      </main>
    </div>
  );
};

export default Upload;
