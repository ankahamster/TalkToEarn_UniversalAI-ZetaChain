import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, Upload, MessageSquare, LayoutDashboard } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "首页", icon: LayoutDashboard },
    { path: "/upload", label: "上传内容", icon: Upload },
    { path: "/chat", label: "AI 对话", icon: MessageSquare },
    { path: "/dashboard", label: "个人仪表盘", icon: LayoutDashboard },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI DataMarket
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={isActive ? "shadow-glow-primary" : ""}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <Button className="shadow-glow-primary">
            <Wallet className="mr-2 h-4 w-4" />
            连接钱包
          </Button>
        </div>
      </div>
    </nav>
  );
};
