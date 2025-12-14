import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { TrendingUp, Coins, FileText, Zap } from "lucide-react";

const Dashboard = () => {
  const stats = [
    { label: "总收益", value: "1,234 USDT", icon: Coins, color: "text-primary" },
    { label: "Data NFT", value: "12", icon: FileText, color: "text-secondary" },
    { label: "AI 调用次数", value: "856", icon: Zap, color: "text-accent" },
    { label: "本月增长", value: "+23%", icon: TrendingUp, color: "text-primary" },
  ];

  const recentActivity = [
    { id: 1, type: "收益", content: "AI 模型调用收益 +15 USDT", time: "2小时前" },
    { id: 2, type: "铸造", content: "成功铸造 Data NFT #234", time: "5小时前" },
    { id: 3, type: "调用", content: "您的内容被 AI 引用 3 次", time: "1天前" },
    { id: 4, type: "收益", content: "数据授权收益 +28 USDT", time: "2天前" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              个人仪表盘
            </h1>
            <p className="text-muted-foreground text-lg">
              查看您的收益、Data NFT 和 AI 使用记录
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">最近活动</h2>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/30 border border-border/30"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-gradient-card backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4">内容溯源</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Data NFT #234</span>
                    <span className="text-xs text-primary">被引用 15 次</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    区块链技术介绍与应用...
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>收益: 45 USDT</span>
                    <span>•</span>
                    <span>授权: AI 模型 A, B</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-background/30 border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Data NFT #189</span>
                    <span className="text-xs text-secondary">被引用 8 次</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    机器学习算法详解...
                  </p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>收益: 28 USDT</span>
                    <span>•</span>
                    <span>授权: AI 模型 C</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
