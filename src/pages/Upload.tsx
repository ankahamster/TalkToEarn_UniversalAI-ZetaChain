import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload as UploadIcon, FileText, Image } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Upload = () => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!content || !title) {
      toast.error("请填写标题和内容");
      return;
    }

    setIsUploading(true);
    
    // 模拟上传过程
    setTimeout(() => {
      toast.success("内容上传成功！正在准备铸造 NFT...");
      setIsUploading(false);
      setContent("");
      setTitle("");
    }, 2000);
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

              <div className="pt-4">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full shadow-glow-primary"
                  size="lg"
                >
                  <UploadIcon className="mr-2 h-5 w-5" />
                  {isUploading ? "上传中..." : "上传并铸造 NFT"}
                </Button>
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
