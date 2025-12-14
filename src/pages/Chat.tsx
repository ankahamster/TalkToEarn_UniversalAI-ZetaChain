import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "您好！我是 AI 助手，可以帮您生成文本或图像。有什么我可以帮助您的吗？",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // 使用 Server-Sent Events (SSE) 连接后端 API
      const eventSource = new EventSource(`/api/ask?q=${encodeURIComponent(input)}`);
      let responseContent = "";
      let aiMessageIndex: number | null = null;

      eventSource.onmessage = (event) => {
        const data = event.data;
        
        if (data === "[END]") {
          // 响应结束
          eventSource.close();
          setIsLoading(false);
          return;
        }

        responseContent += data;
        
        // 更新或创建 AI 消息
        if (aiMessageIndex === null) {
          // 创建新消息
          const aiMessage: Message = { role: "assistant", content: responseContent };
          setMessages((prev) => {
            const newMessages = [...prev, aiMessage];
            aiMessageIndex = newMessages.length - 1;
            return newMessages;
          });
        } else {
          // 更新现有消息
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[aiMessageIndex] = { 
              ...newMessages[aiMessageIndex], 
              content: responseContent 
            };
            return newMessages;
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        eventSource.close();
        setIsLoading(false);
        toast.error("与服务器的连接出现错误");
      };
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      toast.error("发送消息失败");
    }
  };

  const handleImageGeneration = () => {
    toast.info("图像生成功能即将推出！");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI 对话与生成
            </h1>
            <p className="text-muted-foreground text-lg">
              使用授权的 Data NFT 进行 AI 推理和内容生成
            </p>
          </div>

          <Card className="border-border/50 bg-gradient-card backdrop-blur-sm">
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground shadow-glow-primary"
                        : "bg-card border border-border/50"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/50 rounded-2xl px-4 py-3">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-secondary animate-bounce delay-100" />
                      <div className="w-2 h-2 rounded-full bg-accent animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/50 p-4">
              <div className="flex gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/50"
                  onClick={handleImageGeneration}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  生成图像
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border/50"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  RAG 检索
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="输入您的问题或需求..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  className="border-border/50 bg-background/50"
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="shadow-glow-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-6 p-4 rounded-lg bg-card/30 border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              💡 所有 AI 生成结果都会记录引用的 Data NFT 来源，确保内容溯源
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
