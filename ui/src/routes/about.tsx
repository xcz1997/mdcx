import { Code, GitHub, Info, Storage, Web } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { client } from "@/client/client.gen";

export const Route = createFileRoute("/about")({
  component: About,
});

// 技术栈信息
const techStack = {
  frontend: [
    { name: "React", version: "19.x", description: "UI 框架" },
    { name: "TypeScript", version: "5.x", description: "类型系统" },
    { name: "Material-UI", version: "7.x", description: "组件库" },
    { name: "TanStack Router", version: "1.x", description: "路由" },
    { name: "TanStack Query", version: "5.x", description: "数据获取" },
    { name: "Zustand", version: "5.x", description: "状态管理" },
    { name: "Rsbuild", version: "", description: "构建工具" },
  ],
  backend: [
    { name: "Python", version: "3.13+", description: "运行时" },
    { name: "FastAPI", version: "", description: "Web 框架" },
    { name: "Pydantic", version: "", description: "数据验证" },
    { name: "WebSocket", version: "", description: "实时通信" },
  ],
};

// 功能列表
const features = [
  "视频元数据刮削",
  "多网站数据源支持",
  "批量处理能力",
  "图片裁剪和水印",
  "NFO 文件生成",
  "软链接创建",
  "远程 Web 访问",
  "响应式设计",
];

function About() {
  // 获取版本信息
  interface VersionInfo {
    version: string;
    version_code: number;
  }

  const versionQuery = useQuery({
    queryKey: ["version"],
    queryFn: async () => {
      const response = await client.instance.get<VersionInfo>("/api/v1/config/version");
      return response.data;
    },
  });

  const version = versionQuery.data?.version ?? "v2.0.0";

  return (
    <Box sx={{ p: 2 }}>
      {/* 标题区域 */}
      <Paper
        elevation={1}
        sx={{
          p: 4,
          mb: 3,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1a237e 0%, #283593 100%)"
              : "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Info sx={{ fontSize: 48 }} />
          <Box>
            <Typography variant="h3" fontWeight="bold">
              MDCx
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              视频元数据刮削工具
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label={version} sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} />
          <Chip label="网页版" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} />
          <Chip label="开源" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }} />
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* 项目介绍 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Storage color="primary" />
                <Typography variant="h6">项目介绍</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body1" paragraph>
                MDCx 是一个功能强大的视频元数据刮削和管理工具，支持从多个网站获取视频信息， 自动生成 NFO
                文件和海报图片。
              </Typography>

              <Typography variant="subtitle2" color="primary" gutterBottom>
                主要功能
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {features.map((feature) => (
                  <Chip key={feature} label={feature} size="small" variant="outlined" />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 项目链接 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <GitHub color="primary" />
                <Typography variant="h6">项目链接</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <GitHub />
                  </ListItemIcon>
                  <ListItemText
                    primary="GitHub 仓库"
                    secondary={
                      <Link href="https://github.com/sqzw-x/mdcx" target="_blank" rel="noopener noreferrer">
                        github.com/sqzw-x/mdcx
                      </Link>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Web />
                  </ListItemIcon>
                  <ListItemText primary="项目文档" secondary="查看 README.md 获取使用说明" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 前端技术栈 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Web color="primary" />
                <Typography variant="h6">前端技术栈</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <List dense>
                {techStack.frontend.map((tech) => (
                  <ListItem key={tech.name}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography fontWeight={500}>{tech.name}</Typography>
                          {tech.version && (
                            <Chip
                              label={tech.version}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                          )}
                        </Box>
                      }
                      secondary={tech.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 后端技术栈 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Code color="primary" />
                <Typography variant="h6">后端技术栈</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <List dense>
                {techStack.backend.map((tech) => (
                  <ListItem key={tech.name}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography fontWeight={500}>{tech.name}</Typography>
                          {tech.version && (
                            <Chip
                              label={tech.version}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: "0.7rem" }}
                            />
                          )}
                        </Box>
                      }
                      secondary={tech.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* 开源许可证 */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                开源许可证
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                本项目基于 MIT 许可证开源。您可以自由使用、修改和分发本软件，但需保留原始版权声明。
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
