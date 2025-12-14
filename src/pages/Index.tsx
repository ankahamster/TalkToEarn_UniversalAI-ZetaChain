import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Database, Brain, Shield, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Database,
      title: "数据资产化",
      description: "将您的内容铸造为 Data NFT，确保数据所有权和价值",
    },
    {
      icon: Brain,
      title: "AI 模型授权",
      description: "灵活设置 AI 模型访问权限，实现数据商业化",
    },
    {
      icon: Shield,
      title: "内容溯源",
      description: "区块链技术确保每次 AI 调用都可追溯和验证",
    },
    {
      icon: Sparkles,
      title: "收益分配",
      description: "自动化的智能合约收益分配机制",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        <section className="container mx-auto px-4 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Web3 × AI 数据市场</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
              让您的数据
              <br />
              为 AI 赋能
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              通过区块链技术将内容转化为 Data NFT，授权 AI 模型使用并获得收益。
              每次 AI 推理都可追溯，确保创作者权益。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/upload">
                <Button size="lg" className="shadow-glow-primary">
                  开始上传
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/chat">
                <Button size="lg" variant="outline" className="border-border/50">
                  体验 AI 对话
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl" />
            <Card className="relative p-8 border-border/50 bg-gradient-card backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="text-center">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              工作流程
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm">
                <div className="text-4xl font-bold text-primary mb-4">01</div>
                <h3 className="text-xl font-semibold mb-2">上传内容</h3>
                <p className="text-muted-foreground">
                  上传您的文本、文档等内容到 IPFS，系统自动向量化处理
                </p>
              </Card>

              <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm">
                <div className="text-4xl font-bold text-secondary mb-4">02</div>
                <h3 className="text-xl font-semibold mb-2">铸造 NFT</h3>
                <p className="text-muted-foreground">
                  智能合约将数据打包为 Data NFT，设置 AI 模型访问权限
                </p>
              </Card>

              <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm">
                <div className="text-4xl font-bold text-accent mb-4">03</div>
                <h3 className="text-xl font-semibold mb-2">获得收益</h3>
                <p className="text-muted-foreground">
                  AI 模型使用您的数据时，自动获得收益并记录链上
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              立即开始您的数据资产化之旅
            </h2>
            <p className="text-muted-foreground mb-8">
              连接钱包，上传内容，让 AI 为您的创作付费
            </p>
            <Link to="/upload">
              <Button size="lg" className="shadow-glow-primary">
                立即开始
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 AI DataMarket. Powered by Web3 & AI Technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
