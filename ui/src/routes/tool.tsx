import {
  CleaningServices as CleanIcon,
  Cookie as CookieIcon,
  Folder as FolderIcon,
  Language as LanguageIcon,
  Link as LinkIcon,
  Movie as MovieIcon,
  Person as PersonIcon,
  PhotoLibrary as PhotoIcon,
  PlayArrow as PlayIcon,
  Search as SearchIcon,
  Subtitles as SubtitlesIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { WebsiteSchema } from "@/client/schemas.gen";
import {
  addSubtitlesMutation,
  checkCookiesMutation,
  cleanFilesMutation,
  completeActorsMutation,
  createSymlinkMutation,
  findMissingMutation,
  getSiteUrlsOptions,
  manageExtrafanartCopyMutation,
  manageExtrasMutation,
  manageThemeVideosMutation,
  scrapeSingleFileMutation,
  setSiteUrlMutation,
  startScrapeMutation,
} from "../client/@tanstack/react-query.gen";
import type { Website } from "../client/types.gen";
import { useToast } from "../contexts/ToastProvider";

export const Route = createFileRoute("/tool")({
  component: ToolComponent,
});

function ToolComponent() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  // 开始刮削
  const startScrape = useMutation(startScrapeMutation());

  // 单文件刮削
  const [singleFilePath, setSingleFilePath] = useState("");
  const [singleFileUrl, setSingleFileUrl] = useState("");
  const scrapeSingleFile = useMutation(scrapeSingleFileMutation());

  // 创建软链接
  const [sourceDir, setSourceDir] = useState("");
  const [destDir, setDestDir] = useState("");
  const [copyFiles, setCopyFiles] = useState(false);
  const createSymlink = useMutation(createSymlinkMutation());

  // 添加字幕
  const addSubtitles = useMutation(addSubtitlesMutation());

  // 演员相关
  const completeActors = useMutation(completeActorsMutation());

  // Cookie 检查
  const checkCookies = useMutation(checkCookiesMutation());

  // 设置网站网址
  const [site, setSite] = useState<Website>("javdb");
  const [siteUrl, setSiteUrl] = useState("");
  const setSiteUrlMut = useMutation(setSiteUrlMutation());
  const currentSiteUrl = useQuery(getSiteUrlsOptions());
  const currentUrls = currentSiteUrl.isSuccess ? currentSiteUrl.data : null;
  useEffect(() => setSiteUrl(currentUrls?.[site] ?? ""), [currentUrls, site]); // 切换网站时使用当前网址

  // 查找缺失番号
  const [actorsName, setActorsName] = useState("");
  const findMissing = useMutation(findMissingMutation());

  // 文件管理工具
  const cleanFiles = useMutation(cleanFilesMutation());
  const manageExtras = useMutation(manageExtrasMutation());
  const manageExtrafanartCopy = useMutation(manageExtrafanartCopyMutation());
  const manageThemeVideos = useMutation(manageThemeVideosMutation());

  const handleStartScrape = async () => {
    showInfo("正在启动刮削任务...");
    try {
      await startScrape.mutateAsync({});
      showSuccess("刮削任务已成功启动，正在跳转到日志页面...");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`刮削任务启动失败: ${error}`);
    }
  };

  const handleScrapeSingleFile = async () => {
    if (!singleFilePath || !singleFileUrl) {
      showError("请输入文件路径和URL");
      return;
    }
    showInfo("正在启动单文件刮削任务...");
    try {
      await scrapeSingleFile.mutateAsync({
        body: {
          path: singleFilePath,
          url: singleFileUrl,
        },
      });
      showSuccess("单文件刮削任务已成功启动，正在跳转到日志页面...");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`单文件刮削任务启动失败: ${error}`);
    }
  };

  const handleCreateSymlink = async () => {
    if (!sourceDir || !destDir) {
      showError("请输入源目录和目标目录");
      return;
    }
    showInfo("正在启动软链接创建任务...");
    try {
      await createSymlink.mutateAsync({
        body: {
          source_dir: sourceDir,
          dest_dir: destDir,
          copy_files: copyFiles,
        },
      });
      showSuccess("软链接创建任务已成功启动，正在跳转到日志页面...");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`软链接创建任务启动失败: ${error}`);
    }
  };

  const handleAddSubtitles = async () => {
    showInfo("正在启动字幕检查和添加任务...");
    try {
      await addSubtitles.mutateAsync({});
      showSuccess("字幕检查和添加任务已成功启动，正在跳转到日志页面...");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`字幕添加任务启动失败: ${error}`);
    }
  };

  const handleCompleteActors = async () => {
    showInfo("正在启动演员信息补全任务...");
    try {
      await completeActors.mutateAsync({});
      showSuccess("演员信息补全任务已成功启动，正在跳转到日志页面...");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`演员信息补全任务启动失败: ${error}`);
    }
  };

  const handleCheckCookies = async () => {
    showInfo("正在检查Cookie有效性...");
    try {
      await checkCookies.mutateAsync({});
      showSuccess("Cookie检查已完成。");
    } catch (error) {
      showError(`Cookie检查失败: ${error}`);
    }
  };

  const handleSetSiteUrl = async () => {
    try {
      await setSiteUrlMut.mutateAsync({ body: { site, url: siteUrl } });
      await currentSiteUrl.refetch(); // 重新获取服务器设置
      siteUrl ? showSuccess(`成功设置 ${site} 网址: ${siteUrl}`) : showSuccess(`已清除 ${site} 的自定义网址`);
    } catch (error) {
      showError(`设置网站网址失败: ${error}`);
    }
  };

  const handleFindMissing = async () => {
    if (!actorsName) {
      showError("请输入演员名字");
      return;
    }
    showInfo("正在启动缺失番号查找任务...");
    try {
      await findMissing.mutateAsync({
        body: {
          actors: actorsName,
          local_library: [],
        },
      });
      showSuccess("缺失番号查找任务已启动，正在跳转到日志页面...");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`缺失番号查找任务启动失败: ${error}`);
    }
  };

  const handleCleanFiles = async () => {
    showInfo("正在启动文件清理任务...");
    try {
      await cleanFiles.mutateAsync({});
      showSuccess("文件清理任务已启动，正在跳转到日志页面...");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`文件清理任务启动失败: ${error}`);
    }
  };

  const handleManageExtras = async (mode: "add" | "del") => {
    showInfo(`正在启动 extras ${mode === "add" ? "添加" : "删除"}任务...`);
    try {
      await manageExtras.mutateAsync({ body: { mode } });
      showSuccess(`Extras ${mode === "add" ? "添加" : "删除"}任务已启动，正在跳转到日志页面...`);
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`Extras 任务启动失败: ${error}`);
    }
  };

  const handleManageExtrafanartCopy = async (mode: "add" | "del") => {
    showInfo(`正在启动剧照副本${mode === "add" ? "添加" : "删除"}任务...`);
    try {
      await manageExtrafanartCopy.mutateAsync({ body: { mode } });
      showSuccess(`剧照副本${mode === "add" ? "添加" : "删除"}任务已启动，正在跳转到日志页面...`);
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`剧照副本任务启动失败: ${error}`);
    }
  };

  const handleManageThemeVideos = async (mode: "add" | "del") => {
    showInfo(`正在启动主题视频${mode === "add" ? "添加" : "删除"}任务...`);
    try {
      await manageThemeVideos.mutateAsync({ body: { mode } });
      showSuccess(`主题视频${mode === "add" ? "添加" : "删除"}任务已启动，正在跳转到日志页面...`);
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`主题视频任务启动失败: ${error}`);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        工具集合
      </Typography>

      <Grid container spacing={3}>
        {/* 刮削工具 */}
        <Grid size={12}>
          <Card>
            <CardHeader avatar={<PlayIcon color="primary" />} title="刮削工具" subheader="开始批量刮削或单文件刮削" />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* 批量刮削 */}
                <Button
                  variant="contained"
                  startIcon={<PlayIcon />}
                  onClick={handleStartScrape}
                  disabled={startScrape.isPending}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {startScrape.isPending ? "正在启动..." : "开始批量刮削"}
                </Button>

                <Divider sx={{ my: 1 }} />

                {/* 单文件刮削 */}
                <Typography variant="subtitle2" color="text.secondary">
                  单文件刮削
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <TextField
                    label="文件路径"
                    value={singleFilePath}
                    onChange={(e) => setSingleFilePath(e.target.value)}
                    size="small"
                    sx={{ flexGrow: 1, minWidth: 200 }}
                  />
                  <TextField
                    label="指定网址"
                    value={singleFileUrl}
                    onChange={(e) => setSingleFileUrl(e.target.value)}
                    size="small"
                    sx={{ flexGrow: 1, minWidth: 200 }}
                  />
                </Box>
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button variant="outlined" onClick={handleScrapeSingleFile} disabled={scrapeSingleFile.isPending}>
                {scrapeSingleFile.isPending ? "正在刮削..." : "单文件刮削"}
              </Button>
              <Button
                variant="text"
                color="secondary"
                onClick={() => {
                  setSingleFilePath("");
                  setSingleFileUrl("");
                }}
                disabled={!singleFilePath && !singleFileUrl}
              >
                清空
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 缺失番号查找 */}
        <Grid size={12}>
          <Card>
            <CardHeader
              avatar={<SearchIcon color="primary" />}
              title="缺失番号查找"
              subheader="根据演员名查找本地媒体库缺失的番号"
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  输入演员名字（多个用逗号分隔），也可以直接输入演员的 JAVDB 主页地址。
                </Typography>
                <TextField
                  label="演员名字"
                  placeholder="例如：三上悠亚,桃乃木かな"
                  value={actorsName}
                  onChange={(e) => setActorsName(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleFindMissing}
                disabled={findMissing.isPending}
              >
                {findMissing.isPending ? "正在查找..." : "查找缺失番号"}
              </Button>
              <Button variant="text" color="secondary" onClick={() => setActorsName("")} disabled={!actorsName}>
                清空
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 文件管理工具 */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardHeader avatar={<LinkIcon color="primary" />} title="文件管理工具" subheader="软链接创建和字幕管理" />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  创建软链接
                </Typography>
                <TextField
                  label="源目录（本地盘）"
                  value={sourceDir}
                  onChange={(e) => setSourceDir(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="目标目录（网盘）"
                  value={destDir}
                  onChange={(e) => setDestDir(e.target.value)}
                  size="small"
                  fullWidth
                />
                <FormControlLabel
                  control={<Checkbox checked={copyFiles} onChange={(e) => setCopyFiles(e.target.checked)} />}
                  label="复制 nfo、图片、字幕等文件"
                />
              </Box>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, flexWrap: "wrap", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={handleCreateSymlink}
                disabled={createSymlink.isPending}
              >
                {createSymlink.isPending ? "正在创建..." : "创建软链接"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<SubtitlesIcon />}
                onClick={handleAddSubtitles}
                disabled={addSubtitles.isPending}
              >
                {addSubtitles.isPending ? "正在处理..." : "检查并添加字幕"}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 演员工具 */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: "100%" }}>
            <CardHeader avatar={<PersonIcon color="primary" />} title="演员工具" subheader="补全演员信息" />
            <Divider />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                扫描媒体库中的演员信息，自动补全缺失的演员数据。
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PersonIcon />}
                onClick={handleCompleteActors}
                disabled={completeActors.isPending}
              >
                {completeActors.isPending ? "正在补全..." : "补全演员信息"}
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* 媒体文件管理 */}
        <Grid size={12}>
          <Card>
            <CardHeader
              avatar={<FolderIcon color="primary" />}
              title="媒体文件管理"
              subheader="清理文件、管理剧照副本和主题视频"
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* 文件清理 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    文件清理
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    根据配置的清理规则检查并清理媒体目录中的无用文件。
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CleanIcon />}
                    onClick={handleCleanFiles}
                    disabled={cleanFiles.isPending}
                  >
                    {cleanFiles.isPending ? "正在清理..." : "检查并清理文件"}
                  </Button>
                </Box>

                <Divider />

                {/* 剧照副本管理 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    剧照副本管理 (Extrafanart Copy)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    为所有视频批量添加或删除剧照副本文件夹。
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoIcon />}
                      onClick={() => handleManageExtrafanartCopy("add")}
                      disabled={manageExtrafanartCopy.isPending}
                    >
                      添加所有剧照副本
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<PhotoIcon />}
                      onClick={() => handleManageExtrafanartCopy("del")}
                      disabled={manageExtrafanartCopy.isPending}
                    >
                      删除所有剧照副本
                    </Button>
                  </Box>
                </Box>

                <Divider />

                {/* Extras 管理 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Extras 附加内容管理 (Behind the Scenes)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    为所有视频批量添加或删除 behind the scenes 文件夹。
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoIcon />}
                      onClick={() => handleManageExtras("add")}
                      disabled={manageExtras.isPending}
                    >
                      添加所有 Extras
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<PhotoIcon />}
                      onClick={() => handleManageExtras("del")}
                      disabled={manageExtras.isPending}
                    >
                      删除所有 Extras
                    </Button>
                  </Box>
                </Box>

                <Divider />

                {/* 主题视频管理 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    主题视频管理 (Theme Videos)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    为所有视频批量添加或删除 backdrops/theme_video.mp4 文件。
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      startIcon={<MovieIcon />}
                      onClick={() => handleManageThemeVideos("add")}
                      disabled={manageThemeVideos.isPending}
                    >
                      添加所有主题视频
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<MovieIcon />}
                      onClick={() => handleManageThemeVideos("del")}
                      disabled={manageThemeVideos.isPending}
                    >
                      删除所有主题视频
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 网站设置工具 */}
        <Grid size={12}>
          <Card>
            <CardHeader
              avatar={<LanguageIcon color="primary" />}
              title="网站设置工具"
              subheader="Cookie检查和自定义网址设置"
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Cookie检查 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Cookie 有效性检查
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<CookieIcon />}
                    onClick={handleCheckCookies}
                    disabled={checkCookies.isPending}
                  >
                    {checkCookies.isPending ? "正在检查..." : "检查 Cookie"}
                  </Button>
                </Box>

                <Divider />

                {/* 网站网址设置 */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    设置网站自定义网址
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      alignItems: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <InputLabel>选择网站</InputLabel>
                      <Select value={site} label="选择网站" onChange={(e) => setSite(e.target.value)}>
                        {WebsiteSchema.enum.map((w) => (
                          <MenuItem key={w} value={w}>
                            {w}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="自定义网址"
                      placeholder="留空则使用默认网址"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      size="small"
                      sx={{ flexGrow: 1, minWidth: 200 }}
                    />
                    <Button variant="outlined" onClick={handleSetSiteUrl} disabled={setSiteUrlMut.isPending}>
                      {setSiteUrlMut.isPending ? "正在设置..." : "保存设置"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
