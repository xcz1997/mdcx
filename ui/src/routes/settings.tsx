import {
  Add as AddIcon,
  CleaningServices as CleanIcon,
  ContentCut as CropIcon,
  Delete as DeleteIcon,
  DriveFileMove as MoveIcon,
  Link as LinkIcon,
  Movie as MovieIcon,
  Person as PersonIcon,
  PhotoLibrary as PhotoIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Subtitles as SubtitlesIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Form } from "@rjsf/mui";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useBlocker, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { listConfigsOptions } from "@/api/config";
import {
  manageKodiActorsMutation,
  showActorListMutation,
  updateActorPhotosMutation,
} from "@/api/tools";
import {
  addSubtitlesMutation,
  cleanFilesMutation,
  completeActorsMutation,
  createConfigMutation,
  createSymlinkMutation,
  deleteConfigMutation,
  findMissingMutation,
  getConfigSchemaOptions,
  getConfigUiSchemaOptions,
  getCurrentConfigOptions,
  manageExtrafanartCopyMutation,
  manageExtrasMutation,
  manageThemeVideosMutation,
  moveVideosMutation,
  resetConfigMutation,
  scrapeSingleFileMutation,
  switchConfigMutation,
  updateConfigMutation,
} from "@/client/@tanstack/react-query.gen";
import { fields } from "@/components/form";
import { GridObjectFieldTemplate } from "@/components/form/GridObjectFieldTemplate";
import { ConfirmDialog } from "@/components/ui";
import { useToast } from "@/contexts/ToastProvider";
import { ImageCropDialog } from "@/features/tools/components/ImageCropDialog";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

// ============= Qt5 12 Tab 结构定义（严格复刻） =============
// Tab 1: 刮削目录 - 9 cards (5 tools + 4 settings)
// Tab 2: 刮削模式 - 8 cards
// Tab 3: 刮削网站 - 3 cards
// Tab 4: 下载 - 6 cards
// Tab 5: 命名 - 9 cards
// Tab 6: 翻译 - 10 cards
// Tab 7: 字幕 - 2 cards
// Tab 8: 水印 - 5 cards
// Tab 9: NFO - 1 card
// Tab 10: 演员 - 4 cards
// Tab 11: 网络 - 4 cards
// Tab 12: 高级 - 4 cards

interface FieldGroup {
  title: string;
  fields: string[];
  description?: string;
  isToolCard?: boolean;
}

interface TabConfig {
  id: string;
  label: string;
  groups: FieldGroup[];
}

const TAB_CONFIGS: TabConfig[] = [
  {
    id: "scrape_dir",
    label: "刮削目录",
    groups: [
      // 工具卡片 (前 5 个)
      { title: "单文件刮削", fields: [], isToolCard: true, description: "指定某个文件的番号网址进行刮削，当存在相同番号时可用这个" },
      { title: "裁剪图片", fields: [], isToolCard: true, description: "将某个图片裁剪为封面图大小，支持加水印" },
      { title: "检查演员缺失番号", fields: [], isToolCard: true, description: "检查资源库中指定演员本地缺失的番号" },
      { title: "移动视频、字幕", fields: [], isToolCard: true, description: "将待刮削目录下所有子目录中的视频移动到一个目录中以方便进行查看" },
      { title: "软链接助手", fields: [], isToolCard: true, description: "将挂载的网盘文件目录及子目录中的所有视频一键创建软链接到本地" },
      // 设置卡片 (后 4 个)
      { title: "刮削目录", fields: ["media_path", "softlink_path", "success_output_folder", "failed_output_folder", "extrafanart_folder"] },
      { title: "文件扫描设置", fields: ["folders", "string", "file_size", "no_escape"] },
      { title: "文件清理设置", fields: ["clean_enable", "clean_ext", "clean_name", "clean_contains", "clean_size", "clean_ignore_ext", "clean_ignore_contains"], isToolCard: true },
      { title: "文件格式设置", fields: ["media_type", "sub_type"] },
    ],
  },
  {
    id: "scrape_mode",
    label: "刮削模式",
    groups: [
      { title: "刮削模式", fields: ["main_mode", "read_mode", "sort_mode_del_pic"], isToolCard: true },
      { title: "刮削成功后移动文件", fields: ["success_file_move"], isToolCard: true },
      { title: "刮削失败时移动文件", fields: ["failed_file_move"], isToolCard: true },
      { title: "刮削结束后删除空文件夹", fields: ["del_empty_folder"], isToolCard: true },
      { title: "更新模式规则", fields: ["update_mode", "update_a_folder", "update_b_folder", "update_c_filetemplate", "update_d_folder", "update_titletemplate"], isToolCard: true },
      { title: "刮削成功后重命名文件", fields: ["success_file_rename"], isToolCard: true },
      { title: "多线程刮削", fields: ["thread_number", "thread_time", "javdb_time"] },
      { title: "刮削成功后在输出目录创建软链接或硬链接", fields: ["soft_link"], isToolCard: true },
    ],
  },
  {
    id: "scrape_site",
    label: "刮削网站",
    groups: [
      { title: "类型刮削网站", fields: ["website_youma", "website_wuma", "website_suren", "website_fc2", "website_oumei", "website_guochan"], isToolCard: true },
      { title: "字段刮削网站", fields: ["field_configs"], isToolCard: true },
      { title: "网站偏好", fields: ["scrape_like", "website_single", "title_sehua", "title_yesjav", "title_sehua_zh", "actor_realname", "outline_format"], isToolCard: true },
    ],
  },
  {
    id: "download",
    label: "下载",
    groups: [
      { title: "下载", fields: ["download_files"], isToolCard: true },
      { title: "保留旧文件", fields: ["keep_files"], isToolCard: true },
      { title: "下载高清图", fields: ["download_hd_pics", "google_used", "google_exclude"], isToolCard: true },
      { title: "显示剧照", fields: [], isToolCard: true },
      { title: "创建剧照副本", fields: ["extrafanart_folder"], isToolCard: true },
      { title: "创建主题视频", fields: [], isToolCard: true },
    ],
  },
  {
    id: "naming",
    label: "命名",
    groups: [
      { title: "视频命名规则", fields: ["folder_name", "naming_file", "naming_media", "prevent_char", "fields_rule"], isToolCard: true },
      { title: "分集命名规则", fields: ["cd_name", "cd_char"], isToolCard: true },
      { title: "长度命名规则", fields: ["folder_name_max", "file_name_max", "actor_name_max", "actor_name_more"] },
      { title: "马赛克命名规则", fields: ["umr_style", "leak_style", "wuma_style", "youma_style"], isToolCard: true },
      { title: "图片命名规则", fields: ["pic_simple_name"], isToolCard: true },
      { title: "预告片命名规则", fields: ["trailer_simple_name"], isToolCard: true },
      { title: "字段命名规则", fields: ["suffix_sort", "actor_no_name", "release_rule"] },
      { title: "画质命名规则", fields: ["hd_name", "hd_get"], isToolCard: true },
      { title: "其他说明", fields: [], isToolCard: true },
    ],
  },
  {
    id: "translate",
    label: "翻译",
    groups: [
      { title: "翻译引擎", fields: ["translate_config"], isToolCard: true },
    ],
  },
  {
    id: "subtitle",
    label: "字幕",
    groups: [
      { title: "中文字幕字符规则", fields: ["cnword_char", "cnword_style", "folder_cnword", "file_cnword"], isToolCard: true },
      { title: "添加外挂字幕", fields: ["subtitle_folder", "subtitle_add", "subtitle_add_chs", "subtitle_add_rescrape"], isToolCard: true },
    ],
  },
  {
    id: "watermark",
    label: "水印",
    groups: [
      { title: "自定义水印样式", fields: [], isToolCard: true },
      { title: "水印设置", fields: ["poster_mark", "thumb_mark", "fanart_mark", "mark_size", "mark_type"], isToolCard: true },
      { title: "不固定位置", fields: ["mark_pos"], isToolCard: true },
      { title: "固定不同位置", fields: ["mark_pos_sub", "mark_pos_mosaic", "mark_pos_hd"], isToolCard: true },
      { title: "固定一个位置", fields: ["mark_fixed", "mark_pos_corner"], isToolCard: true },
    ],
  },
  {
    id: "nfo",
    label: "NFO",
    groups: [
      { title: "写入 NFO 的字段", fields: ["nfo_include_new", "nfo_tagline", "nfo_tag_include", "nfo_tag_series", "nfo_tag_studio", "nfo_tag_publisher", "nfo_tag_actor", "nfo_tag_actor_contains"], isToolCard: true },
    ],
  },
  {
    id: "actor",
    label: "演员",
    groups: [
      { title: "Emby/Jellyfin 设置", fields: ["server_type", "emby_url", "api_key", "user_id"], isToolCard: true },
      { title: "补全 Emby/Jellyfin 演员头像", fields: ["emby_on", "gfriends_github", "actor_photo_folder"], isToolCard: true },
      { title: "补全 Emby/Jellyfin 演员信息", fields: ["use_database", "info_database_path"], isToolCard: true },
      { title: "补全 Kodi/Plex/Jvedio 演员头像", fields: ["actor_photo_kodi_auto"], isToolCard: true },
    ],
  },
  {
    id: "network",
    label: "网络",
    groups: [
      { title: "Cookie设置", fields: ["javdb", "javbus"], isToolCard: true },
      { title: "网络设置", fields: ["use_proxy", "proxy", "timeout", "retry"] },
      { title: "网站设置", fields: ["site_configs"] },
      { title: "API Token", fields: ["theporndb_api_token"] },
    ],
  },
  {
    id: "advanced",
    label: "高级",
    groups: [
      { title: "保存日志", fields: ["save_log"] },
      { title: "调试模式（日志页面）", fields: ["show_web_log", "show_from_log", "show_data_log"], isToolCard: true },
      { title: "检查更新", fields: ["update_check"] },
      { title: "高级功能", fields: ["switch_on", "timed_interval", "rest_count", "rest_time", "local_library", "netdisk_path", "localdisk_path", "window_title"] },
    ],
  },
];

// 根据字段列表过滤 schema
function filterSchemaByFields(schema: RJSFSchema, fieldList: string[]): RJSFSchema {
  if (!schema.properties || fieldList.length === 0) return { type: "object", properties: {} };

  const filteredProperties: RJSFSchema["properties"] = {};

  for (const field of fieldList) {
    if (schema.properties[field]) {
      filteredProperties[field] = schema.properties[field];
    }
  }

  return {
    ...schema,
    properties: filteredProperties,
    required: (schema.required as string[] | undefined)?.filter((r) => fieldList.includes(r)),
  };
}

// 根据字段列表过滤 uiSchema
function filterUiSchemaByFields(uiSchema: UiSchema, fieldList: string[]): UiSchema {
  const filteredUiSchema: UiSchema = {};

  for (const field of fieldList) {
    if (uiSchema[field]) {
      filteredUiSchema[field] = uiSchema[field];
    }
  }

  if (uiSchema["ui:order"]) {
    filteredUiSchema["ui:order"] = (uiSchema["ui:order"] as string[]).filter((f) => fieldList.includes(f) || f === "*");
  }

  return filteredUiSchema;
}

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// 卡片组件
interface GroupCardProps {
  group: FieldGroup;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formData: Record<string, unknown>;
  onChange: (data: { formData?: Record<string, unknown> }) => void;
  children?: ReactNode;
}

function GroupCard({ group, schema, uiSchema, formData, onChange, children }: GroupCardProps) {
  const filteredSchema = useMemo(
    () => filterSchemaByFields(schema, group.fields),
    [schema, group.fields]
  );

  const filteredUiSchema = useMemo(
    () => filterUiSchemaByFields(uiSchema, group.fields),
    [uiSchema, group.fields]
  );

  const hasVisibleFields = filteredSchema.properties && Object.keys(filteredSchema.properties).length > 0;

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: "primary.main" }}>
          {group.title}
        </Typography>
        {group.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {group.description}
          </Typography>
        )}
        {hasVisibleFields && (
          <Form
            schema={filteredSchema}
            uiSchema={filteredUiSchema}
            validator={validator}
            formData={formData}
            fields={fields}
            templates={{ ObjectFieldTemplate: GridObjectFieldTemplate }}
            onChange={onChange}
            liveValidate={false}
          >
            <div />
          </Form>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function SettingsComponent() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // 配置文件管理状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newConfigName, setNewConfigName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // 工具状态
  const [singleFilePath, setSingleFilePath] = useState("");
  const [singleFileUrl, setSingleFileUrl] = useState("");
  const [actorsName, setActorsName] = useState("");
  const [excludeDirs, setExcludeDirs] = useState("");
  const [sourceDir, setSourceDir] = useState("");
  const [destDir, setDestDir] = useState("");
  const [copyFiles, setCopyFiles] = useState(false);
  const [actorListFilterMode, setActorListFilterMode] = useState(0);

  // 图片裁剪
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImagePath, setCropImagePath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 查询
  const configQ = useQuery(getCurrentConfigOptions());
  const schemaQ = useQuery(getConfigSchemaOptions());
  const uiSchemaQ = useQuery(getConfigUiSchemaOptions());
  const configListQ = useQuery(listConfigsOptions());

  // 配置 Mutations
  const updateConfig = useMutation(updateConfigMutation());
  const switchConfig = useMutation(switchConfigMutation());
  const createConfig = useMutation(createConfigMutation());
  const deleteConfig = useMutation(deleteConfigMutation());
  const resetConfig = useMutation(resetConfigMutation());

  // 工具 Mutations
  const scrapeSingleFile = useMutation(scrapeSingleFileMutation());
  const findMissing = useMutation(findMissingMutation());
  const moveVideos = useMutation(moveVideosMutation());
  const createSymlink = useMutation(createSymlinkMutation());
  const cleanFiles = useMutation(cleanFilesMutation());
  const addSubtitles = useMutation(addSubtitlesMutation());
  const completeActors = useMutation(completeActorsMutation());
  const manageExtras = useMutation(manageExtrasMutation());
  const manageExtrafanartCopy = useMutation(manageExtrafanartCopyMutation());
  const manageThemeVideos = useMutation(manageThemeVideosMutation());
  const manageKodiActors = useMutation(manageKodiActorsMutation());
  const showActorList = useMutation(showActorListMutation());
  const updateActorPhotos = useMutation(updateActorPhotosMutation());

  // 未保存提示
  const blocker = useBlocker({
    shouldBlockFn: () => hasChanges,
    enableBeforeUnload: () => hasChanges,
    disabled: !hasChanges,
    withResolver: true,
  });

  const originalData = configQ.data as Record<string, unknown> | undefined;

  // 初始化 formData
  useMemo(() => {
    if (configQ.isSuccess && configQ.data) {
      setFormData(configQ.data as Record<string, unknown>);
      setHasChanges(false);
    }
  }, [configQ.isSuccess, configQ.data]);

  // 处理表单数据变化
  const handleChange = useCallback(
    (data: { formData?: Record<string, unknown> }) => {
      if (data.formData) {
        setFormData((prev) => {
          const newData = { ...prev, ...data.formData };
          if (originalData) {
            const changed = JSON.stringify(newData) !== JSON.stringify(originalData);
            setHasChanges(changed);
          }
          return newData;
        });
      }
    },
    [originalData]
  );

  // ============= 配置管理处理函数 =============

  const handleSubmit = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({ body: formData });
      showSuccess("设置已保存");
      setHasChanges(false);
    } catch (error) {
      showError(`保存失败: ${error}`);
    }
  }, [formData, updateConfig, showSuccess, showError]);

  const handleSwitchConfig = useCallback(
    async (name: string) => {
      if (hasChanges) {
        const confirm = window.confirm("有未保存的更改，切换配置将丢失这些更改。是否继续？");
        if (!confirm) return;
      }
      try {
        const result = await switchConfig.mutateAsync({ query: { name } });
        if (result) {
          setFormData(result.config as Record<string, unknown>);
          setHasChanges(false);
          queryClient.invalidateQueries({ queryKey: ["config"] });
          showSuccess(`已切换到配置: ${name}`);
        }
      } catch (error) {
        showError(`切换配置失败: ${error}`);
      }
    },
    [hasChanges, switchConfig, queryClient, showSuccess, showError]
  );

  const handleCreateConfig = useCallback(async () => {
    if (!newConfigName.trim()) {
      showError("请输入配置名称");
      return;
    }
    try {
      await createConfig.mutateAsync({ query: { name: newConfigName.trim() } });
      queryClient.invalidateQueries({ queryKey: ["config", "list"] });
      showSuccess(`配置 ${newConfigName} 已创建`);
      setCreateDialogOpen(false);
      setNewConfigName("");
    } catch (error) {
      showError(`创建配置失败: ${error}`);
    }
  }, [newConfigName, createConfig, queryClient, showSuccess, showError]);

  const handleDeleteConfig = useCallback(async () => {
    const activeConfig = configListQ.data?.active;
    const configs = configListQ.data?.configs || [];
    if (!activeConfig || configs.length <= 1) return;

    const otherConfig = configs.find((c) => c.name !== activeConfig);
    if (!otherConfig) {
      showError("无法删除：没有其他可用的配置文件");
      return;
    }

    try {
      const switchResult = await switchConfig.mutateAsync({ query: { name: otherConfig.name } });
      if (switchResult) {
        setFormData(switchResult.config as Record<string, unknown>);
        setHasChanges(false);
      }

      await deleteConfig.mutateAsync({ query: { name: activeConfig } });
      queryClient.invalidateQueries({ queryKey: ["config"] });
      showSuccess(`配置 "${activeConfig}" 已删除，已切换到 "${otherConfig.name}"`);
    } catch (error) {
      showError(`删除配置失败: ${error}`);
    }
  }, [configListQ.data, deleteConfig, switchConfig, queryClient, showSuccess, showError]);

  const handleResetConfig = useCallback(async () => {
    try {
      const result = await resetConfig.mutateAsync({});
      if (result) {
        setFormData(result as Record<string, unknown>);
        setHasChanges(false);
        queryClient.invalidateQueries({ queryKey: ["config"] });
        showSuccess("配置已重置为默认值");
      }
    } catch (error) {
      showError(`重置配置失败: ${error}`);
    }
  }, [resetConfig, queryClient, showSuccess, showError]);

  // ============= 工具处理函数 =============

  const handleScrapeSingleFile = async () => {
    if (!singleFilePath || !singleFileUrl) {
      showError("请输入文件路径和URL");
      return;
    }
    showInfo("正在启动单文件刮削任务...");
    try {
      await scrapeSingleFile.mutateAsync({ body: { path: singleFilePath, url: singleFileUrl } });
      showSuccess("单文件刮削任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`单文件刮削任务启动失败: ${error}`);
    }
  };

  const handleFindMissing = async () => {
    if (!actorsName) {
      showError("请输入演员名字");
      return;
    }
    showInfo("正在启动缺失番号查找任务...");
    try {
      await findMissing.mutateAsync({ body: { actors: actorsName, local_library: [] } });
      showSuccess("缺失番号查找任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`缺失番号查找任务启动失败: ${error}`);
    }
  };

  const handleMoveVideos = async () => {
    showInfo("正在启动视频移动任务...");
    try {
      const excludeDirList = excludeDirs.split(/[,\n]/).map((dir) => dir.trim()).filter((dir) => dir.length > 0);
      await moveVideos.mutateAsync({ body: { exclude_dirs: excludeDirList } });
      showSuccess("视频移动任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`视频移动任务启动失败: ${error}`);
    }
  };

  const handleCreateSymlink = async () => {
    if (!sourceDir || !destDir) {
      showError("请输入源目录和目标目录");
      return;
    }
    showInfo("正在启动软链接创建任务...");
    try {
      await createSymlink.mutateAsync({ body: { source_dir: sourceDir, dest_dir: destDir, copy_files: copyFiles } });
      showSuccess("软链接创建任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`软链接创建任务启动失败: ${error}`);
    }
  };

  const handleCleanFiles = async () => {
    showInfo("正在启动文件清理任务...");
    try {
      await cleanFiles.mutateAsync({});
      showSuccess("文件清理任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`文件清理任务启动失败: ${error}`);
    }
  };

  const handleAddSubtitles = async () => {
    showInfo("正在启动字幕添加任务...");
    try {
      await addSubtitles.mutateAsync({});
      showSuccess("字幕添加任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`字幕添加任务启动失败: ${error}`);
    }
  };

  const handleCompleteActors = async () => {
    showInfo("正在启动演员信息补全任务...");
    try {
      await completeActors.mutateAsync({});
      showSuccess("演员信息补全任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`演员信息补全任务启动失败: ${error}`);
    }
  };

  const handleManageExtras = async (mode: "add" | "del") => {
    const action = mode === "add" ? "添加" : "删除";
    showInfo(`正在启动 extras ${action}任务...`);
    try {
      await manageExtras.mutateAsync({ body: { mode } });
      showSuccess(`Extras ${action}任务已启动`);
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`Extras 任务启动失败: ${error}`);
    }
  };

  const handleManageExtrafanartCopy = async (mode: "add" | "del") => {
    const action = mode === "add" ? "添加" : "删除";
    showInfo(`正在启动剧照副本${action}任务...`);
    try {
      await manageExtrafanartCopy.mutateAsync({ body: { mode } });
      showSuccess(`剧照副本${action}任务已启动`);
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`剧照副本任务启动失败: ${error}`);
    }
  };

  const handleManageThemeVideos = async (mode: "add" | "del") => {
    const action = mode === "add" ? "添加" : "删除";
    showInfo(`正在启动主题视频${action}任务...`);
    try {
      await manageThemeVideos.mutateAsync({ body: { mode } });
      showSuccess(`主题视频${action}任务已启动`);
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`主题视频任务启动失败: ${error}`);
    }
  };

  const handleManageKodiActors = async (mode: "add" | "del") => {
    const action = mode === "add" ? "添加" : "删除";
    showInfo(`正在启动 Kodi 演员照片${action}任务...`);
    try {
      await manageKodiActors.mutateAsync({ body: { mode } });
      showSuccess(`Kodi 演员照片${action}任务已启动`);
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`Kodi 演员照片任务启动失败: ${error}`);
    }
  };

  const handleShowActorList = async () => {
    showInfo("正在查询媒体服务器演员列表...");
    try {
      await showActorList.mutateAsync({ body: { filter_mode: actorListFilterMode } });
      showSuccess("演员列表查询任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`演员列表查询失败: ${error}`);
    }
  };

  const handleUpdateActorPhotos = async () => {
    showInfo("正在启动演员照片补全任务...");
    try {
      await updateActorPhotos.mutateAsync();
      showSuccess("演员照片补全任务已启动");
      setTimeout(() => navigate({ to: "/logs" }), 1000);
    } catch (error) {
      showError(`演员照片补全任务启动失败: ${error}`);
    }
  };

  // 图片裁剪
  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCropImagePath(imageUrl);
      setCropDialogOpen(true);
    }
    event.target.value = "";
  }, []);

  const handleCropSave = useCallback(
    async (result: { cropBox: { x1: number; y1: number; x2: number; y2: number }; watermarks: string[] }) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = cropImagePath;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      const { x1, y1, x2, y2 } = result.cropBox;
      const cropWidth = x2 - x1;
      const cropHeight = y2 - y1;

      const canvas = document.createElement("canvas");
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        showError("无法创建画布");
        return;
      }

      ctx.drawImage(img, x1, y1, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "cropped_poster.jpg";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showSuccess("裁剪后的图片已下载");
          }
        },
        "image/jpeg",
        0.95
      );
    },
    [cropImagePath, showSuccess, showError]
  );

  const handleCropDialogClose = useCallback(() => {
    setCropDialogOpen(false);
    if (cropImagePath.startsWith("blob:")) {
      URL.revokeObjectURL(cropImagePath);
    }
    setCropImagePath("");
  }, [cropImagePath]);

  // ============= 渲染工具卡片 =============

  const renderToolCard = (tabId: string, cardTitle: string) => {
    // Tab 1: 刮削目录
    if (tabId === "scrape_dir") {
      if (cardTitle === "单文件刮削") {
        return (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              label="视频路径"
              value={singleFilePath}
              onChange={(e) => setSingleFilePath(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <TextField
              label="网址"
              value={singleFileUrl}
              onChange={(e) => setSingleFileUrl(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={handleScrapeSingleFile}
              disabled={scrapeSingleFile.isPending}
            >
              开始
            </Button>
          </Box>
        );
      }
      if (cardTitle === "裁剪图片") {
        return (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button variant="outlined" startIcon={<CropIcon />} onClick={handleOpenFilePicker}>
              选择图片
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </Box>
        );
      }
      if (cardTitle === "检查演员缺失番号") {
        return (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              label="演员名或 JAVDB 主页地址"
              placeholder="多个用逗号分隔"
              value={actorsName}
              onChange={(e) => setActorsName(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 300 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleFindMissing}
              disabled={findMissing.isPending}
            >
              查找
            </Button>
          </Box>
        );
      }
      if (cardTitle === "移动视频、字幕") {
        return (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              label="排除目录（可选）"
              placeholder="多个用逗号或换行分隔"
              value={excludeDirs}
              onChange={(e) => setExcludeDirs(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 300 }}
            />
            <Button
              variant="contained"
              startIcon={<MoveIcon />}
              onClick={handleMoveVideos}
              disabled={moveVideos.isPending}
            >
              移动
            </Button>
          </Box>
        );
      }
      if (cardTitle === "软链接助手") {
        return (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              label="网盘目录"
              value={sourceDir}
              onChange={(e) => setSourceDir(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <TextField
              label="本地目录"
              value={destDir}
              onChange={(e) => setDestDir(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <FormControlLabel
              control={<Checkbox checked={copyFiles} onChange={(e) => setCopyFiles(e.target.checked)} />}
              label="复制 nfo、图片、字幕"
            />
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              onClick={handleCreateSymlink}
              disabled={createSymlink.isPending}
            >
              创建
            </Button>
          </Box>
        );
      }
      if (cardTitle === "文件清理设置") {
        return (
          <Button
            variant="outlined"
            startIcon={<CleanIcon />}
            onClick={handleCleanFiles}
            disabled={cleanFiles.isPending}
            sx={{ mt: 2 }}
          >
            立即清理
          </Button>
        );
      }
    }

    // Tab 2: 刮削模式
    if (tabId === "scrape_mode") {
      if (cardTitle === "刮削模式") {
        const mainMode = formData.main_mode as number;
        return (
          <Box sx={{ mt: 1 }}>
            {/* 正常模式说明 */}
            {mainMode === 1 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                执行：刮削-&gt;下载封面-&gt;重命名-&gt;水印等全部操作，适合要海报墙的情况
              </Typography>
            )}
            {/* 更新模式说明 */}
            {mainMode === 2 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                流程同正常模式，但命名按照更新模式规则执行（在下方设置），适合二次刮削
              </Typography>
            )}
            {/* 读取模式说明 */}
            {mainMode === 3 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  不刮削，读取本地信息并显示，适合检查媒体库或媒体库重新整理分类（无需联网）
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, mb: 1 }}>
                  读取模式专用选项：
                </Typography>
              </Box>
            )}
            {/* 视频模式说明 */}
            {mainMode === 4 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  执行：刮削-&gt;重命名，仅整理本地视频，不下载图片，适合不要海报墙的情况
                </Typography>
              </Box>
            )}
          </Box>
        );
      }
      if (cardTitle === "刮削成功后移动文件") {
        const successMove = formData.success_file_move as boolean;
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {successMove
              ? "刮削成功时，移动文件到成功输出目录"
              : "刮削成功时，不移动文件位置，仍在原目录（适合已整理好文件夹或二次刮削场景）"}
          </Typography>
        );
      }
      if (cardTitle === "刮削失败时移动文件") {
        const failedMove = formData.failed_file_move as boolean;
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {failedMove
              ? "刮削失败后，移动文件到失败输出目录"
              : "刮削失败后，不移动文件位置，仍在原目录"}
          </Typography>
        );
      }
      if (cardTitle === "刮削结束后删除空文件夹") {
        const delEmpty = formData.del_empty_folder as boolean;
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {delEmpty
              ? "刮削结束后，删除刮削目录中的所有空文件夹"
              : "刮削结束后，不删除空文件夹"}
          </Typography>
        );
      }
      if (cardTitle === "更新模式规则") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              假定视频文件现在的路径是： ../A/B/C.mp4
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: "warning.main",
                borderRadius: 1,
                "& p": { m: 0, lineHeight: 1.8 },
              }}
            >
              <Typography variant="body2" component="div">
                <p>⚠️ 保留文件：请到 设置 &gt; 下载 &gt; 保留旧文件 或下载，设置要保留或更新的文件内容</p>
                <p>⚠️ 跳过文件：在视频目录新建一个名为 skip 的空文件，即可自动跳过该目录及子目录（所有模式均有效）</p>
                <p>⚠️ 移动文件：失败时不移动文件，成功时按更新模式规则移动</p>
                <p>⚠️ 重命名文件：在「成功后重命名文件」中设置是否重命名，命名规则同「命名」-「视频文件名」</p>
              </Typography>
            </Box>
          </Box>
        );
      }
      if (cardTitle === "刮削成功后重命名文件") {
        const successRename = formData.success_file_rename as boolean;
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {successRename
              ? "刮削成功时，按「命名」-「视频命名规则」-「视频文件名」重命名文件"
              : "刮削成功时，继续使用原来文件名"}
          </Typography>
        );
      }
      if (cardTitle === "刮削成功后在输出目录创建软链接或硬链接") {
        const softLink = formData.soft_link as number;
        return (
          <Box sx={{ mt: 1 }}>
            {softLink === 0 && (
              <Typography variant="body2" color="text.secondary">
                适合 NAS 和硬盘用户。本地党可随心所欲整理文件。
                <br />
                注意：选择此项，下面的「成功后移动文件」「失败后移动文件」才会生效
              </Typography>
            )}
            {softLink === 1 && (
              <Typography variant="body2" color="text.secondary">
                适合网盘用户。刮削资料存本地，Emby 加载快，网盘读写少。
                <br />
                注意：Windows 用户，成功后的输出目录必须选择本地磁盘（系统限制）
              </Typography>
            )}
            {softLink === 2 && (
              <Typography variant="body2" color="text.secondary">
                适合 PT 用户。刮削资料同盘单独存放，不影响分享率。
                <br />
                注意：Mac 用户，请选择创建软连接，输出目录同盘即可（硬链接有权限问题）
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              注：软硬链接不会移动和重命名原视频文件，仅移动和重命名链接文件
            </Typography>
          </Box>
        );
      }
    }

    // Tab 3: 刮削网站
    if (tabId === "scrape_site") {
      if (cardTitle === "类型刮削网站") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
              <p><strong>有码番号</strong>：比如 MIDE-111，以及不符合以下类型的番号</p>
              <p><strong>素人番号</strong>：比如 259LUXU-1111</p>
              <p><strong>FC2番号</strong>：比如 FC2-111111</p>
              <p><strong>欧美番号</strong>：比如 111111-111，111111_111，n1111，HEYZO-1111，SMD-111</p>
              <p><strong>国产番号</strong>：「网站偏好」-「指定网站」指定 mdtv、hdouban，或文件路径含有「国产」、「麻豆」时，将自动使用以上网站刮削国产番号</p>
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "字段刮削网站") {
        return (
          <Box sx={{ mt: 1, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              说明：对于某个字段，如果不指定刮削网站，则将使用任意已获取网站的数据；否则将依次使用字段刮削网站与该类型的刮削网站的交集。
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              例如，若标题设置为 theporndb,dmm,javdb,fc2ppvdb，有码设置为 dmm,javdb,javbus，FC2设置为 fc2,fc2ppvdb
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              则对于有码影片，将依次使用 dmm,javdb 的标题数据；对于FC2影片将使用 fc2ppvdb 的标题数据
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "网站偏好") {
        const scrapeLike = formData.scrape_like as string;
        return (
          <Box sx={{ mt: 1 }}>
            {scrapeLike === "speed" && (
              <Typography variant="body2" color="text.secondary">
                按番号类型设置的刮削网站进行刮削，字段来自单个网站。速度快一些。
              </Typography>
            )}
            {scrapeLike === "info" && (
              <Typography variant="body2" color="text.secondary">
                按各个字段设置的刮削网站进行刮削，字段来自多个网站。字段全一些。
              </Typography>
            )}
            {scrapeLike === "single" && (
              <Typography variant="body2" color="text.secondary">
                当指定网站时，所有番号将只使用该网站刮削！
              </Typography>
            )}
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "warning.main", borderRadius: 1, color: "warning.contrastText" }}>
              <Typography variant="body2">
                ⚠️ 下载剧照、预告片，请选择「字段优先」或「指定网站」！「速度优先」信息不全！
              </Typography>
            </Box>
            {scrapeLike === "info" && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: "info.main", borderRadius: 1, color: "info.contrastText" }}>
                <Typography variant="body2">
                  ⚠️ 注意！选择「字段优先」时，以下设置才有效！
                </Typography>
              </Box>
            )}
          </Box>
        );
      }
    }

    // Tab 4: 下载
    if (tabId === "download") {
      if (cardTitle === "下载") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              封面图(poster)：Emby 视图选择封面图时，列表页使用竖图显示；
              缩略图(thumb)：Emby 视图选择缩略图时，列表页使用横图显示；
              背景图(fanart)：在 Emby 详情页作为背景图显示；
              剧照(extrafanart)：在 Emby 详情页作为背景轮播显示；
              预告片(trailer)：在 Emby 详情页可以播放预告片；
              nfo：包含标题、简介、标签等信息，在 Emby 详情页展示。
            </Typography>
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "warning.main", borderRadius: 1, color: "warning.contrastText" }}>
              <Typography variant="body2">
                ⚠️ 下载剧照、预告片，请选择「字段优先」或「指定网站」！「速度优先」信息不全！
              </Typography>
            </Box>
          </Box>
        );
      }
      if (cardTitle === "保留旧文件") {
        return (
          <Box sx={{ mt: 1, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              勾选时，将使用本地文件（如有），不再重新下载。
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 600 }}>
              ⚠️ 注意：不勾选时，本地旧文件将被删除！并根据上方设置的下载项重新下载！
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "下载高清图") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              将从片商官网和其他一些网站查找高清图，当有高清图片时，下载高清图片
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "显示剧照") {
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              复制剧照到视频下的 behind the scenes 目录，Emby 浏览时，剧照会作为附加内容在详情页下方显示。
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                startIcon={<PhotoIcon />}
                onClick={() => handleManageExtras("add")}
                disabled={manageExtras.isPending}
              >
                为所有视频复制剧照
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleManageExtras("del")}
                disabled={manageExtras.isPending}
              >
                删除所有复制的剧照
              </Button>
            </Box>
          </Box>
        );
      }
      if (cardTitle === "创建剧照副本") {
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              在 Emby 中，剧照图片作为背景显示，无法手动浏览。如需在 Emby 中手动查看剧照，可复制剧照图片到单独目录，并且媒体库类型选择「家庭视频与照片」。
              请使用「extrafanart」以外的其他名字。目录名字为空或「extrafanart」时，将不会创建副本目录。
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
                startIcon={<DeleteIcon />}
                onClick={() => handleManageExtrafanartCopy("del")}
                disabled={manageExtrafanartCopy.isPending}
              >
                删除所有剧照副本
              </Button>
            </Box>
          </Box>
        );
      }
      if (cardTitle === "创建主题视频") {
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              复制预告片到视频下的 backdrops 目录，当在 Emby 浏览该番号时，预告片会作为背景视频播放。
              开启主题视频：Emby 设置-显示-主题视频-开（PC 端可以打开，手机端不建议打开，会变成全屏播放）
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
                startIcon={<DeleteIcon />}
                onClick={() => handleManageThemeVideos("del")}
                disabled={manageThemeVideos.isPending}
              >
                删除所有主题视频
              </Button>
            </Box>
          </Box>
        );
      }
    }

    // Tab 5: 命名
    if (tabId === "naming") {
      if (cardTitle === "视频命名规则") {
        return (
          <Box sx={{ mt: 1, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
              <p><strong>可用命名字段</strong>: number, title, actor, studio, publisher, year, month, day, release, runtime, director, series, mosaic, definition, cnword</p>
              <p><strong>示例</strong>: actor/number title → 明日花绮罗/IPX-001 明日花绮罗超高级风俗</p>
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "分集命名规则") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            默认识别分集格式: -cd1, -CD1, -1, -A 等。分集后缀将追加到文件名末尾。
          </Typography>
        );
      }
      if (cardTitle === "马赛克命名规则") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            设置无码、流出、破解、有码等类型的命名标识。留空则不添加该标识。
          </Typography>
        );
      }
      if (cardTitle === "图片命名规则") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            简化命名: poster.jpg；完整命名: 视频文件名-poster.jpg
          </Typography>
        );
      }
      if (cardTitle === "预告片命名规则") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            简化命名: trailer.mp4；完整命名: 视频文件名-trailer.mp4
          </Typography>
        );
      }
      if (cardTitle === "画质命名规则") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            画质命名方式: 720P/1080P/4K 或 HD/FHD/UHD
          </Typography>
        );
      }
      if (cardTitle === "其他说明") {
        return (
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
              <p><strong>Emby 多版本显示</strong>: 当同一番号有多个版本时，Emby 会自动合并显示</p>
              <p><strong>分集封面</strong>: 分集视频的封面图会单独显示在 Emby 详情页中</p>
            </Typography>
          </Box>
        );
      }
    }

    // Tab 6: 翻译
    if (tabId === "translate") {
      if (cardTitle === "翻译引擎") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            当勾选多个翻译引擎时，将随机使用所勾选的其中任一翻译引擎进行翻译。
          </Typography>
        );
      }
    }

    // Tab 7: 字幕
    if (tabId === "subtitle") {
      if (cardTitle === "中文字幕字符规则") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            设置用于判断和命名中文字幕文件的字符规则。判断字符用于识别是否为中文字幕，命名字符用于输出文件名。
          </Typography>
        );
      }
      if (cardTitle === "添加外挂字幕") {
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              从指定字幕目录中查找匹配的字幕文件，自动添加到视频同目录下。支持批量字幕包。
            </Typography>
            <Button
              variant="outlined"
              startIcon={<SubtitlesIcon />}
              onClick={handleAddSubtitles}
              disabled={addSubtitles.isPending}
            >
              检查并添加字幕
            </Button>
          </Box>
        );
      }
    }

    // Tab 8: 水印
    if (tabId === "watermark") {
      if (cardTitle === "自定义水印样式") {
        return (
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
              <p>可自定义水印图片包，放置于配置目录的 Watermarks 文件夹中。</p>
              <p>水印图片命名: sub.png (字幕), youma.png (有码), leak.png (流出), umr.png (破解), uncensored.png (无码), hd.png (高清)</p>
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "水印设置") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            选择需要添加水印的图片类型和水印种类。水印大小建议 3-8 之间。
          </Typography>
        );
      }
      if (cardTitle === "不固定位置") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            从首个水印位置开始，顺时针方向依次添加多个水印。
          </Typography>
        );
      }
      if (cardTitle === "固定不同位置") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            分别为不同种类的水印（4K/8K、字幕、马赛克）设置固定位置。
          </Typography>
        );
      }
      if (cardTitle === "固定一个位置") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            所有水印在指定位置依次横向显示。
          </Typography>
        );
      }
    }

    // Tab 9: NFO
    if (tabId === "nfo") {
      if (cardTitle === "写入 NFO 的字段") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            选择需要写入 NFO 文件的字段。NFO 文件包含视频的元数据信息，供 Emby/Jellyfin 等媒体服务器读取。
          </Typography>
        );
      }
    }

    // Tab 11: 网络
    if (tabId === "network") {
      if (cardTitle === "Cookie设置") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            部分网站需要登录后才能访问完整信息。请在浏览器中登录后，复制 Cookie 值到此处。
          </Typography>
        );
      }
    }

    // Tab 12: 高级
    if (tabId === "advanced") {
      if (cardTitle === "调试模式（日志页面）") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            启用后，日志页面将显示更详细的刮削过程信息，便于排查问题。
          </Typography>
        );
      }
    }

    // Tab 10: 演员
    if (tabId === "actor") {
      if (cardTitle === "Emby/Jellyfin 设置") {
        return (
          <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>查看信息</InputLabel>
              <Select
                value={actorListFilterMode}
                label="查看信息"
                onChange={(e) => setActorListFilterMode(e.target.value as number)}
              >
                <MenuItem value={0}>所有演员</MenuItem>
                <MenuItem value={1}>有头像有信息</MenuItem>
                <MenuItem value={2}>没头像有信息</MenuItem>
                <MenuItem value={3}>有头像没信息</MenuItem>
                <MenuItem value={4}>没头像没信息</MenuItem>
                <MenuItem value={5}>有信息</MenuItem>
                <MenuItem value={6}>没信息</MenuItem>
                <MenuItem value={7}>有头像</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={handleShowActorList}
              disabled={showActorList.isPending}
            >
              查看
            </Button>
          </Box>
        );
      }
      if (cardTitle === "补全 Emby/Jellyfin 演员头像") {
        return (
          <Button
            variant="outlined"
            startIcon={<PhotoIcon />}
            onClick={handleUpdateActorPhotos}
            disabled={updateActorPhotos.isPending}
            sx={{ mt: 2 }}
          >
            开始补全
          </Button>
        );
      }
      if (cardTitle === "补全 Emby/Jellyfin 演员信息") {
        return (
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={handleCompleteActors}
            disabled={completeActors.isPending}
            sx={{ mt: 2 }}
          >
            开始补全
          </Button>
        );
      }
      if (cardTitle === "补全 Kodi/Plex/Jvedio 演员头像") {
        return (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PhotoIcon />}
              onClick={() => handleManageKodiActors("add")}
              disabled={manageKodiActors.isPending}
            >
              开始补全
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleManageKodiActors("del")}
              disabled={manageKodiActors.isPending}
            >
              清除所有 .actors 文件夹
            </Button>
          </Box>
        );
      }
    }

    return null;
  };

  const schema = useMemo(() => {
    if (!schemaQ.data) return null;
    const s = structuredClone(schemaQ.data) as RJSFSchema;
    // 前端转换：将 cd_name 整数字段转为下拉选择框
    if (s.properties?.cd_name) {
      (s.properties.cd_name as RJSFSchema).oneOf = [
        { const: 0, title: "小写 cd" },
        { const: 1, title: "大写 CD" },
        { const: 2, title: "纯数字" },
      ];
    }
    return s;
  }, [schemaQ.data]);

  if (!schemaQ.isSuccess || !configQ.isSuccess || !uiSchemaQ.isSuccess || !schema) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const uiSchema = uiSchemaQ.data as UiSchema;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* 页面标题和配置管理 */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            设置
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          {/* 配置文件选择器 */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="config-select-label">配置文件</InputLabel>
            <Select
              labelId="config-select-label"
              value={configListQ.data?.active || ""}
              label="配置文件"
              onChange={(e) => handleSwitchConfig(e.target.value)}
              disabled={configListQ.isLoading || switchConfig.isPending}
            >
              {configListQ.data?.configs.map((config) => (
                <MenuItem key={config.name} value={config.name}>
                  {config.name}
                  {config.is_active && " (当前)"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 配置操作按钮 */}
          <Tooltip title="新建配置">
            <IconButton color="primary" onClick={() => setCreateDialogOpen(true)} size="small">
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="重置当前配置">
            <IconButton color="warning" onClick={() => setResetDialogOpen(true)} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="删除当前配置">
            <IconButton
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              size="small"
              disabled={(configListQ.data?.configs.length || 0) <= 1}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          {/* 保存按钮 */}
          {hasChanges && (
            <Typography variant="body2" color="warning.main">
              有未保存的更改
            </Typography>
          )}
          <Button variant="contained" onClick={handleSubmit} disabled={!hasChanges || updateConfig.isPending}>
            {updateConfig.isPending ? "保存中..." : "保存设置"}
          </Button>
        </Box>
      </Box>

      {/* 新建配置对话框 */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>新建配置</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="配置名称"
            fullWidth
            variant="outlined"
            value={newConfigName}
            onChange={(e) => setNewConfigName(e.target.value)}
            placeholder="例如: my-config"
            helperText="输入新配置文件的名称（不含扩展名）"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleCreateConfig}
            variant="contained"
            disabled={!newConfigName.trim() || createConfig.isPending}
          >
            {createConfig.isPending ? "创建中..." : "创建"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重置确认对话框 */}
      <ConfirmDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={handleResetConfig}
        title="重置配置"
        message="确定要将当前配置重置为默认值吗？此操作不可撤销。"
        confirmText="重置"
        confirmColor="warning"
        loading={resetConfig.isPending}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfig}
        title="删除配置"
        message={`确定要删除配置 "${configListQ.data?.active}" 吗？此操作不可撤销。`}
        confirmText="删除"
        confirmColor="error"
        loading={deleteConfig.isPending}
      />

      {/* 离开页面确认对话框 */}
      <ConfirmDialog
        open={blocker.status === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="有未保存的更改"
        message="您有未保存的设置更改。确定要离开此页面吗？离开后所有未保存的更改将丢失。"
        confirmText="离开"
        cancelText="留在此页"
        confirmColor="warning"
      />

      {/* Tab 导航 - 12 个 Tab，严格复刻 Qt5 */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              minHeight: 48,
              minWidth: 80,
            },
          }}
        >
          {TAB_CONFIGS.map((tab, index) => (
            <Tab
              key={tab.id}
              label={tab.label}
              id={`settings-tab-${index}`}
              aria-controls={`settings-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Card>

      {/* Tab 内容 - 分组卡片 */}
      {TAB_CONFIGS.map((tab, index) => (
        <TabPanel key={tab.id} value={currentTab} index={index}>
          <Grid container spacing={3}>
            {tab.groups.map((group) => (
              <Grid key={group.title} size={{ xs: 12, lg: group.fields.length > 3 ? 12 : 6 }}>
                <GroupCard
                  group={group}
                  schema={schema}
                  uiSchema={uiSchema}
                  formData={formData}
                  onChange={handleChange}
                >
                  {group.isToolCard && renderToolCard(tab.id, group.title)}
                </GroupCard>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      ))}

      {/* 图片裁剪对话框 */}
      <ImageCropDialog
        open={cropDialogOpen}
        onClose={handleCropDialogClose}
        imagePath={cropImagePath}
        imageType="poster"
        onSave={handleCropSave}
      />
    </Box>
  );
}
