import {
  Add as AddIcon,
  CleaningServices as CleanIcon,
  ContentCut as CropIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  DriveFileMove as MoveIcon,
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
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
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
import { manageKodiActorsMutation, showActorListMutation, updateActorPhotosMutation } from "@/api/tools";
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
  halfWidth?: boolean; // 强制占半行宽度
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
      {
        title: "单文件刮削",
        fields: [],
        isToolCard: true,
        description: "指定某个文件的番号网址进行刮削，当存在相同番号时可用这个",
      },
      { title: "裁剪图片", fields: [], isToolCard: true, description: "将某个图片裁剪为封面图大小，支持加水印" },
      { title: "检查演员缺失番号", fields: [], isToolCard: true, description: "检查资源库中指定演员本地缺失的番号" },
      {
        title: "移动视频、字幕",
        fields: [],
        isToolCard: true,
        description: "将待刮削目录下所有子目录中的视频移动到一个目录中以方便进行查看",
      },
      {
        title: "软链接助手",
        fields: [],
        isToolCard: true,
        description: "将挂载的网盘文件目录及子目录中的所有视频一键创建软链接到本地",
      },
      // 设置卡片 (后 4 个)
      {
        title: "刮削目录",
        fields: ["media_path", "softlink_path", "success_output_folder", "failed_output_folder", "extrafanart_folder"],
      },
      { title: "文件扫描设置", fields: ["folders", "string", "file_size", "no_escape"] },
      {
        title: "文件清理设置",
        fields: [
          "clean_enable",
          "clean_ext",
          "clean_name",
          "clean_contains",
          "clean_size",
          "clean_ignore_ext",
          "clean_ignore_contains",
        ],
        isToolCard: true,
      },
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
      {
        title: "更新模式规则",
        fields: [
          "update_mode",
          "update_a_folder",
          "update_b_folder",
          "update_c_filetemplate",
          "update_d_folder",
          "update_titletemplate",
        ],
        isToolCard: true,
      },
      { title: "刮削成功后重命名文件", fields: ["success_file_rename"], isToolCard: true },
      { title: "多线程刮削", fields: ["thread_number", "thread_time", "javdb_time"] },
      { title: "刮削成功后在输出目录创建软链接或硬链接", fields: ["soft_link"], isToolCard: true },
    ],
  },
  {
    id: "scrape_site",
    label: "刮削网站",
    groups: [
      {
        title: "类型刮削网站",
        fields: ["website_youma", "website_wuma", "website_suren", "website_fc2", "website_oumei", "website_guochan"],
        isToolCard: true,
      },
      { title: "字段刮削网站", fields: ["field_configs"], isToolCard: true, halfWidth: true },
      {
        title: "网站偏好",
        fields: [
          "scrape_like",
          "website_single",
          "title_sehua",
          "title_yesjav",
          "title_sehua_zh",
          "actor_realname",
          "outline_format",
        ],
        isToolCard: true,
        halfWidth: true,
      },
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
      {
        title: "视频命名规则",
        fields: ["folder_name", "naming_file", "naming_media", "prevent_char", "fields_rule"],
        isToolCard: true,
      },
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
      { title: "翻译引擎", fields: ["translate_config.translate_by", "translate_config.deepl_key"], isToolCard: true },
      {
        title: "LLM 翻译",
        fields: [
          "translate_config.llm_url",
          "translate_config.llm_model",
          "translate_config.llm_key",
          "translate_config.llm_prompt",
          "translate_config.llm_max_req_sec",
          "translate_config.llm_max_try",
          "translate_config.llm_temperature",
        ],
        isToolCard: true,
      },
      { title: "标题", fields: ["title_sehua", "title_yesjav", "title_sehua_zh"], isToolCard: true },
      { title: "简介", fields: ["outline_format"], isToolCard: true },
      { title: "演员", fields: ["actor_realname"], isToolCard: true },
      { title: "标签", fields: [], isToolCard: true },
      { title: "系列", fields: [], isToolCard: true },
      { title: "片商", fields: [], isToolCard: true },
      { title: "发行商", fields: [], isToolCard: true },
      { title: "导演", fields: [], isToolCard: true },
    ],
  },
  {
    id: "subtitle",
    label: "字幕",
    groups: [
      {
        title: "中文字幕字符规则",
        fields: ["cnword_char", "cnword_style", "folder_cnword", "file_cnword"],
        isToolCard: true,
      },
      {
        title: "添加外挂字幕",
        fields: ["subtitle_folder", "subtitle_add", "subtitle_add_chs", "subtitle_add_rescrape"],
        isToolCard: true,
      },
    ],
  },
  {
    id: "watermark",
    label: "水印",
    groups: [
      // Qt5 顺序：水印设置 -> 不固定位置 -> 固定一个位置 -> 固定不同位置 -> 自定义水印样式
      {
        title: "水印设置",
        fields: ["poster_mark", "thumb_mark", "fanart_mark", "mark_size", "mark_type", "mark_fixed"],
        isToolCard: true,
      },
      { title: "不固定位置", fields: ["mark_pos"], isToolCard: true },
      { title: "固定一个位置", fields: ["mark_pos_corner"], isToolCard: true },
      { title: "固定不同位置", fields: ["mark_pos_sub", "mark_pos_mosaic", "mark_pos_hd"], isToolCard: true },
      { title: "自定义水印样式", fields: [], isToolCard: true },
    ],
  },
  {
    id: "nfo",
    label: "NFO",
    groups: [
      {
        title: "写入 NFO 的字段",
        fields: [
          "nfo_include_new",
          "nfo_tagline",
          "nfo_tag_include",
          "nfo_tag_series",
          "nfo_tag_studio",
          "nfo_tag_publisher",
          "nfo_tag_actor",
          "nfo_tag_actor_contains",
        ],
        isToolCard: true,
      },
    ],
  },
  {
    id: "actor",
    label: "演员",
    groups: [
      { title: "Emby/Jellyfin 设置", fields: ["server_type", "emby_url", "api_key", "user_id"], isToolCard: true },
      {
        title: "补全 Emby/Jellyfin 演员头像",
        fields: ["emby_on", "gfriends_github", "actor_photo_folder"],
        isToolCard: true,
      },
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
      { title: "定时刮削", fields: [], isToolCard: true },
      { title: "间歇刮削", fields: [], isToolCard: true },
      {
        title: "高级功能",
        fields: ["switch_on", "local_library", "netdisk_path", "localdisk_path", "window_title"],
        isToolCard: true,
      },
    ],
  },
];

// 根据字段列表过滤 schema（支持嵌套路径如 "translate_config.deepl_key"）
function filterSchemaByFields(schema: RJSFSchema, fieldList: string[]): RJSFSchema {
  if (!schema.properties || fieldList.length === 0) return { type: "object", properties: {} };

  const filteredProperties: RJSFSchema["properties"] = {};
  const nestedFields: Record<string, string[]> = {};

  for (const field of fieldList) {
    if (field.includes(".")) {
      // 嵌套字段：如 "translate_config.deepl_key"
      const [parent, ...rest] = field.split(".");
      const childPath = rest.join(".");
      if (!nestedFields[parent]) {
        nestedFields[parent] = [];
      }
      nestedFields[parent].push(childPath);
    } else if (schema.properties[field]) {
      // 顶级字段
      filteredProperties[field] = schema.properties[field];
    }
  }

  // 处理嵌套字段
  for (const [parent, children] of Object.entries(nestedFields)) {
    const parentSchema = schema.properties[parent] as RJSFSchema | undefined;
    if (parentSchema?.properties) {
      const filteredChildProperties: RJSFSchema["properties"] = {};
      for (const child of children) {
        if (parentSchema.properties[child]) {
          filteredChildProperties[child] = parentSchema.properties[child];
        }
      }
      if (Object.keys(filteredChildProperties).length > 0) {
        filteredProperties[parent] = {
          ...parentSchema,
          properties: filteredChildProperties,
          required: (parentSchema.required as string[] | undefined)?.filter((r) => children.includes(r)),
        };
      }
    }
  }

  return {
    ...schema,
    properties: filteredProperties,
    required: (schema.required as string[] | undefined)?.filter((r) => fieldList.includes(r) || nestedFields[r]),
  };
}

// 根据字段列表过滤 uiSchema（支持嵌套路径如 "translate_config.deepl_key"）
function filterUiSchemaByFields(uiSchema: UiSchema, fieldList: string[]): UiSchema {
  const filteredUiSchema: UiSchema = {};
  const nestedFields: Record<string, string[]> = {};

  for (const field of fieldList) {
    if (field.includes(".")) {
      // 嵌套字段
      const [parent, ...rest] = field.split(".");
      const childPath = rest.join(".");
      if (!nestedFields[parent]) {
        nestedFields[parent] = [];
      }
      nestedFields[parent].push(childPath);
    } else if (uiSchema[field]) {
      // 顶级字段
      filteredUiSchema[field] = uiSchema[field];
    }
  }

  // 处理嵌套字段
  for (const [parent, children] of Object.entries(nestedFields)) {
    const parentUiSchema = uiSchema[parent] as UiSchema | undefined;
    if (parentUiSchema) {
      const filteredChildUiSchema: UiSchema = {};
      for (const child of children) {
        if (parentUiSchema[child]) {
          filteredChildUiSchema[child] = parentUiSchema[child];
        }
      }
      if (Object.keys(filteredChildUiSchema).length > 0) {
        filteredUiSchema[parent] = filteredChildUiSchema;
      }
    }
  }

  if (uiSchema["ui:order"]) {
    const topLevelFields = fieldList.filter((f) => !f.includes("."));
    const parentFields = Object.keys(nestedFields);
    filteredUiSchema["ui:order"] = (uiSchema["ui:order"] as string[]).filter(
      (f) => topLevelFields.includes(f) || parentFields.includes(f) || f === "*",
    );
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
  const filteredSchema = useMemo(() => filterSchemaByFields(schema, group.fields), [schema, group.fields]);

  const filteredUiSchema = useMemo(() => filterUiSchemaByFields(uiSchema, group.fields), [uiSchema, group.fields]);

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
    [originalData],
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
    [hasChanges, switchConfig, queryClient, showSuccess, showError],
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
      const excludeDirList = excludeDirs
        .split(/[,\n]/)
        .map((dir) => dir.trim())
        .filter((dir) => dir.length > 0);
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
        0.95,
      );
    },
    [cropImagePath, showSuccess, showError],
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
      if (cardTitle === "刮削目录") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>待刮削视频目录：</strong>指含有视频的文件夹，将刮削该目录（含子目录）所有视频的元数据信息
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>排除目录：</strong>指不想要刮削的目录，可以填写多个目录，以逗号分开（中英文逗号都可以）
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>成功输出目录：</strong>指刮削成功时，视频将移动到这个文件夹。输出目录可以不在待刮削视频目录下
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>失败输出目录：</strong>指刮削失败时，视频将移动到这个文件夹。输出目录可以不在待刮削视频目录下
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                component="div"
                sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}
              >
                {`如果创建软链接时要复制图片和NFO，请到「工具」-「软链接助手」勾选即可
1，软链接路径支持命名字段：
   end_folder_name （指待刮削目录上最后的文件夹名）
2，成功/失败输出目录支持命名字段：
   end_folder_name，first_folder_name （指待刮削目录下第一层子文件夹名）`}
              </Typography>
            </Box>
          </Box>
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
            {failedMove ? "刮削失败后，移动文件到失败输出目录" : "刮削失败后，不移动文件位置，仍在原目录"}
          </Typography>
        );
      }
      if (cardTitle === "刮削结束后删除空文件夹") {
        const delEmpty = formData.del_empty_folder as boolean;
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {delEmpty ? "刮削结束后，删除刮削目录中的所有空文件夹" : "刮削结束后，不删除空文件夹"}
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
              <p>
                <strong>有码番号</strong>：比如 MIDE-111，以及不符合以下类型的番号
              </p>
              <p>
                <strong>无码番号</strong>：比如 111111-111，111111_111，n1111，HEYZO-1111，SMD-111
              </p>
              <p>
                <strong>素人番号</strong>：比如 259LUXU-1111
              </p>
              <p>
                <strong>FC2番号</strong>：比如 FC2-111111
              </p>
              <p>
                <strong>欧美番号</strong>：比如 111111-111，111111_111，n1111，HEYZO-1111，SMD-111
              </p>
              <p>
                <strong>国产番号</strong>：「网站偏好」-「指定网站」指定
                mdtv、hdouban，或文件路径含有「国产」、「麻豆」时，将自动使用以上网站刮削国产番号
              </p>
              <p>
                <strong>动漫里番</strong>：「网站偏好」-「指定网站」指定
                getchu、dmm、getchu_dmm，或文件路径含有「里番」、「动漫」时，将自动使用 getchu_dmm（二合一）刮削
              </p>
              <p>
                <strong>Mywife</strong>：「网站偏好」-「指定网站」指定 mywife，或文件路径含有 mywife时，将自动使用
                mywife 刮削（番号规则：Mywife No.1230）
              </p>
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
                <Typography variant="body2">⚠️ 注意！选择「字段优先」时，以下设置才有效！</Typography>
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
              封面图(poster)：Emby 视图选择封面图时，列表页使用竖图显示； 缩略图(thumb)：Emby
              视图选择缩略图时，列表页使用横图显示； 背景图(fanart)：在 Emby 详情页作为背景图显示；
              剧照(extrafanart)：在 Emby 详情页作为背景轮播显示； 预告片(trailer)：在 Emby 详情页可以播放预告片；
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              启用 Amazon：将从日亚官网搜索高清图，当找到时直接使用日亚结果
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              启用片商官网：将从片商官网搜索高清图，当图片不高清时会继续使用 Google 搜图
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              启用 Google：将使用图片请求 Google 以图搜图
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              关键词过滤：多个以逗号隔开，优先级按照顺序从前往后
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
              在 Emby 中，剧照图片作为背景显示，无法手动浏览。如需在 Emby
              中手动查看剧照，可复制剧照图片到单独目录，并且媒体库类型选择「家庭视频与照片」。
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
              复制预告片到视频下的 backdrops 目录，当在 Emby 浏览该番号时，预告片会作为背景视频播放。 开启主题视频：Emby
              设置-显示-主题视频-开（PC 端可以打开，手机端不建议打开，会变成全屏播放）
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
              <p>
                <strong>可用命名字段</strong>: number, title, actor, studio, publisher, year, month, day, release,
                runtime, director, series, mosaic, definition, cnword
              </p>
              <p>
                <strong>示例</strong>: actor/number title → 明日花绮罗/IPX-001 明日花绮罗超高级风俗
              </p>
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
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              以视频分辨率的高度数值来命名不同画质：720P、1080P、4K、8K
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              以视频清晰度的英文缩写来命名不同画质：HD、FHD、QHD、UHD
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              qHD=540P，HD=720/960P，FHD=1080P，QHD=1440P(2K)，UHD=4K/8K。低于540P时默认使用高度值命名
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "其他说明") {
        return (
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              component="div"
              sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}
            >
              {`1、多版本显示：
  1）Emby 支持多版本显示（类似选集），需要：
  视频文件名的开头部分必须包含视频目录名。（比如：SSIS-111/SSIS-111-4K.mp4）
  2）分集视频默认会显示为附加视频，如果要以多版本样式显示，分集命名规则还需要选择「-1」

2、分集封面显示：
  Emby 分集封面需要每个分集都提供图片，图片命名规则需要选择「视频文件名-poster.jpg」`}
            </Typography>
          </Box>
        );
      }
    }

    // Tab 6: 翻译
    if (tabId === "translate") {
      // 辅助函数：获取字段配置
      const getFieldConfig = (fieldKey: string) => {
        const fieldConfigs = (formData.field_configs || {}) as Record<
          string,
          { site_prority?: string[]; language?: string; translate?: boolean }
        >;
        return fieldConfigs[fieldKey] || { site_prority: [], language: "undefined", translate: true };
      };

      // 辅助函数：更新字段语言
      const updateFieldLanguage = (fieldKey: string, language: string) => {
        const fieldConfigs = (formData.field_configs || {}) as Record<string, unknown>;
        const config = getFieldConfig(fieldKey);
        const newFieldConfigs = {
          ...fieldConfigs,
          [fieldKey]: { ...config, language },
        };
        handleChange({ formData: { ...formData, field_configs: newFieldConfigs } });
      };

      // 辅助函数：更新字段翻译开关
      const updateFieldTranslate = (fieldKey: string, translate: boolean) => {
        const fieldConfigs = (formData.field_configs || {}) as Record<string, unknown>;
        const config = getFieldConfig(fieldKey);
        const newFieldConfigs = {
          ...fieldConfigs,
          [fieldKey]: { ...config, translate },
        };
        handleChange({ formData: { ...formData, field_configs: newFieldConfigs } });
      };

      // 辅助组件：语言选择
      const LanguageSelect = ({ fieldKey, label }: { fieldKey: string; label: string }) => {
        const config = getFieldConfig(fieldKey);
        return (
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">{label}</FormLabel>
            <RadioGroup
              row
              value={config.language || "undefined"}
              onChange={(e) => updateFieldLanguage(fieldKey, e.target.value)}
            >
              <FormControlLabel value="zh_cn" control={<Radio size="small" />} label="简体中文" />
              <FormControlLabel value="zh_tw" control={<Radio size="small" />} label="繁体中文" />
              <FormControlLabel value="jp" control={<Radio size="small" />} label="日语" />
            </RadioGroup>
          </FormControl>
        );
      };

      if (cardTitle === "翻译引擎") {
        const translateConfig = (formData.translate_config || {}) as {
          translate_by?: string[];
          deepl_key?: string;
        };
        const translateBy = translateConfig.translate_by || [];
        const deeplKey = translateConfig.deepl_key || "";

        const translators = [
          { value: "youdao", label: "有道" },
          { value: "google", label: "谷歌" },
          { value: "deepl", label: "Deepl" },
          { value: "llm", label: "LLM" },
        ];

        const handleTranslatorChange = (translator: string, checked: boolean) => {
          const newTranslateBy = checked
            ? [...translateBy, translator]
            : translateBy.filter((t) => t !== translator);
          handleChange({
            formData: {
              ...formData,
              translate_config: { ...translateConfig, translate_by: newTranslateBy },
            },
          });
        };

        const handleDeeplKeyChange = (value: string) => {
          handleChange({
            formData: {
              ...formData,
              translate_config: { ...translateConfig, deepl_key: value },
            },
          });
        };

        return (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {translators.map((t) => (
                <FormControlLabel
                  key={t.value}
                  control={
                    <Checkbox
                      checked={translateBy.includes(t.value)}
                      onChange={(e) => handleTranslatorChange(t.value, e.target.checked)}
                      size="small"
                    />
                  }
                  label={t.label}
                />
              ))}
            </Box>
            <TextField
              label="Deepl Key"
              value={deeplKey}
              onChange={(e) => handleDeeplKeyChange(e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              当勾选多个时，将随机使用所勾选的其中任一翻译引擎，可降低被封几率
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              填写免费或付费 key 时，将使用 API 翻译；不填写时，将使用网页端口翻译。
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "LLM 翻译") {
        const translateConfig = (formData.translate_config || {}) as {
          llm_url?: string;
          llm_model?: string;
          llm_key?: string;
          llm_prompt?: string;
          llm_max_req_sec?: number;
          llm_max_try?: number;
          llm_temperature?: number;
        };

        const handleLLMConfigChange = (field: string, value: string | number) => {
          handleChange({
            formData: {
              ...formData,
              translate_config: { ...translateConfig, [field]: value },
            },
          });
        };

        return (
          <Box sx={{ mt: 1 }}>
            <TextField
              label="API URL"
              value={translateConfig.llm_url || "https://api.openai.com/v1"}
              onChange={(e) => handleLLMConfigChange("llm_url", e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              helperText="示例: https://api.openai.com/v1"
            />
            <TextField
              label="模型 ID"
              value={translateConfig.llm_model || "gpt-3.5-turbo"}
              onChange={(e) => handleLLMConfigChange("llm_model", e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="API Key"
              value={translateConfig.llm_key || ""}
              onChange={(e) => handleLLMConfigChange("llm_key", e.target.value)}
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              type="password"
            />
            <TextField
              label="提示词模板"
              value={translateConfig.llm_prompt || ""}
              onChange={(e) => handleLLMConfigChange("llm_prompt", e.target.value)}
              size="small"
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 2 }}
              helperText="可用变量：{content} 原文 {lang} 目标语言"
            />
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="最大请求速率"
                value={translateConfig.llm_max_req_sec ?? 1}
                onChange={(e) => handleLLMConfigChange("llm_max_req_sec", Number(e.target.value))}
                size="small"
                type="number"
                sx={{ flex: 1 }}
                helperText="根据 API 提供商限制设定"
              />
              <TextField
                label="最大重试次数"
                value={translateConfig.llm_max_try ?? 3}
                onChange={(e) => handleLLMConfigChange("llm_max_try", Number(e.target.value))}
                size="small"
                type="number"
                sx={{ flex: 1 }}
                helperText="请求失败时重试"
              />
              <TextField
                label="Temperature"
                value={translateConfig.llm_temperature ?? 0.7}
                onChange={(e) => handleLLMConfigChange("llm_temperature", Number(e.target.value))}
                size="small"
                type="number"
                slotProps={{ htmlInput: { step: 0.1, min: 0, max: 2 } }}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        );
      }
      if (cardTitle === "标题") {
        return (
          <Box sx={{ mt: 1 }}>
            <LanguageSelect fieldKey="title" label="标题语言" />
            <Typography variant="body2" color="text.secondary">
              将优先使用刮削网站的中文翻译，当刮削页面无中文时，才使用以下翻译方式。
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              翻译优先级：色花（内置标题数据）&gt; yesjav（在线色花数据）&gt; 翻译引擎
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              当存在色花中文标题时，即使刮削网站有中文翻译，也会使用色花中文标题
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "简介") {
        return (
          <Box sx={{ mt: 1 }}>
            <LanguageSelect fieldKey="outline" label="简介语言" />
            <FormControlLabel
              control={
                <Checkbox
                  checked={getFieldConfig("outline").translate !== false}
                  onChange={(e) => updateFieldTranslate("outline", e.target.checked)}
                />
              }
              label="使用翻译引擎翻译简介"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              当字段语言选择中文，但只刮削到日语时，可使用翻译引擎进行翻译
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "演员") {
        return (
          <Box sx={{ mt: 1 }}>
            <LanguageSelect fieldKey="actors" label="演员语言" />
            <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                component="div"
                sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}
              >
                {`素人和 FC2 番号演员可能是「素人」之类假名字，勾选「使用AV-wiki获取演员真实名字」，可以请求 AV-wiki 获取演员真实日文名，之后可使用映射表翻译为中文！

演员名比较复杂，不能简单使用翻译引擎翻译。主要的问题：演员名翻译不准确、演员有多个名字、同一演员不同番号演员名不统一、各网站使用的演员名不统一等。

不过，通过演员名映射翻译表可以解决这些问题，使刮削后的演员名整齐统一。
实现逻辑：刮削网站获取演员名后，通过查询映射表中的匹配词来映射对应输出词。

演员名映射翻译表文件名为：mapping_actor.xml
· Windows位置：\\配置文件目录\\userdata\\mapping_actor.xml
· Mac位置：/配置文件目录/userdata/mapping_actor.xml`}
              </Typography>
            </Box>
          </Box>
        );
      }
      if (cardTitle === "标签") {
        return (
          <Box sx={{ mt: 1 }}>
            <LanguageSelect fieldKey="tags" label="标签语言" />
            <FormControlLabel
              control={
                <Checkbox
                  checked={getFieldConfig("tags").translate !== false}
                  onChange={(e) => updateFieldTranslate("tags", e.target.checked)}
                />
              }
              label="使用信息映射表翻译标签"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              映射表文件名：mapping_info.xml。作用和演员映射表类似，说明可参考演员映射表。
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "系列") {
        return (
          <Box sx={{ mt: 1 }}>
            <LanguageSelect fieldKey="series" label="系列语言" />
            <FormControlLabel
              control={
                <Checkbox
                  checked={getFieldConfig("series").translate !== false}
                  onChange={(e) => updateFieldTranslate("series", e.target.checked)}
                />
              }
              label="使用信息映射表翻译系列"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              映射表文件名：mapping_info.xml。作用和演员映射表类似，说明可参考演员映射表。
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "片商") {
        return (
          <Box sx={{ mt: 1 }}>
            <LanguageSelect fieldKey="studio" label="片商语言" />
            <FormControlLabel
              control={
                <Checkbox
                  checked={getFieldConfig("studio").translate !== false}
                  onChange={(e) => updateFieldTranslate("studio", e.target.checked)}
                />
              }
              label="使用信息映射表翻译片商"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              映射表文件名：mapping_info.xml。作用和演员映射表类似，说明可参考演员映射表。
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "发行商") {
        return (
          <Box sx={{ mt: 1 }}>
            <LanguageSelect fieldKey="publisher" label="发行商语言" />
            <FormControlLabel
              control={
                <Checkbox
                  checked={getFieldConfig("publisher").translate !== false}
                  onChange={(e) => updateFieldTranslate("publisher", e.target.checked)}
                />
              }
              label="使用信息映射表翻译发行商"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              映射表文件名：mapping_info.xml。作用和演员映射表类似，说明可参考演员映射表。
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "导演") {
        return (
          <Box sx={{ mt: 1 }}>
            <LanguageSelect fieldKey="directors" label="导演语言" />
            <FormControlLabel
              control={
                <Checkbox
                  checked={getFieldConfig("directors").translate !== false}
                  onChange={(e) => updateFieldTranslate("directors", e.target.checked)}
                />
              }
              label="使用信息映射表翻译导演"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              映射表文件名：mapping_info.xml。作用和演员映射表类似，说明可参考演员映射表。
            </Typography>
          </Box>
        );
      }
    }

    // Tab 7: 字幕
    if (tabId === "subtitle") {
      if (cardTitle === "中文字幕字符规则") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>中文字幕判断字符：</strong>指视频文件路径中含有以上字符时，视为该文件有中文字幕，多个以逗号分割。
              此外，还会查找同目录是否存在同名字幕文件、nfo 的标签是否有中文字幕字样
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>中文字幕命名字符：</strong>
              指视频有中文字幕时，在重命名文件名及目录名时在番号后添加该字符表示有中文字幕。 你也可以使用 cnword
              字段来调整添加位置
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>添加中文字幕字符：</strong>选择将中文字幕标识添加到视频目录名或视频文件名
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "添加外挂字幕") {
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              刮削时，如果视频无内嵌字幕且同目录无字幕文件，则从字幕文件目录查找并复制字幕。
              下载字幕包解压，填写字幕文件目录的路径。
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1, mb: 2 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                component="div"
                sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}
              >
                {`当字幕文件目录为空时，将只检查并统计无字幕的视频列表
当视频已识别为有字幕状态时（已有字幕或包含中文字幕字符等），不会重复添加字幕
当视频添加新的外挂字幕后，如勾选重新刮削，将在添加结束后自动刮削
当视频之前添加了外挂字幕，但是还没有重新刮削时，这时也会自动刮削
当勾选添加.chs后缀时，字幕文件会被统一命名为：视频文件名.chs.srt`}
              </Typography>
            </Box>
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
      if (cardTitle === "水印设置") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Emby 中 fanart 作为背景图，不需要添加水印。其他软件作为预览图时，可添加水印
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              水印图片的显示高度 = 设置的水印大小 / 40 * 封面图高度
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                component="div"
                sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}
              >
                {`水印分为字幕水印、马赛克水印、4K/8K水印。
马赛克水印有四个：有码、破解、流出、无码，将按优先级显示其中一种状态
马赛克水印优先级：有码 > 破解 > 流出 > 无码
举例：如果视频是流出版本
·当流出和无码都勾选时，会显示流出水印
·当流出未勾选，无码已勾选，会显示无码水印
·当流出和无码都不勾选时，则不显示水印`}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              注意：不固定位置时，4K/8K 水印会使用固定位置方式，并自动挤开其他水印
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "不固定位置") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            将从首个水印位置开始，顺时针方向依次添加其他水印
          </Typography>
        );
      }
      if (cardTitle === "固定一个位置") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            水印在指定位置依次横向显示
          </Typography>
        );
      }
      if (cardTitle === "固定不同位置") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            可单独设置 4K/8K 水印、字幕水印和马赛克水印的位置
          </Typography>
        );
      }
      if (cardTitle === "自定义水印样式") {
        return (
          <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              component="div"
              sx={{ lineHeight: 1.8, whiteSpace: "pre-line" }}
            >
              {`1、下载水印图片包并解压（也可以使用自己的图片），水印图片的保存路径为：
· Windows位置：（配置文件目录在「设置」-「高级」中设置）
  字幕水印：\\配置文件目录\\userdata\\watermark\\sub.png
  有码水印：\\配置文件目录\\userdata\\watermark\\youma.png
  破解水印：\\配置文件目录\\userdata\\watermark\\umr.png
  流出水印：\\配置文件目录\\userdata\\watermark\\leak.png
  无码水印：\\配置文件目录\\userdata\\watermark\\wuma.png
  4K水印：\\配置文件目录\\userdata\\watermark\\4k.png
  8K水印：\\配置文件目录\\userdata\\watermark\\8k.png
· Mac位置：
  字幕水印：/配置文件目录/userdata/watermark/sub.png
  有码水印：/配置文件目录/userdata/watermark/youma.png
  （其他同上）

2、水印图片显示的逻辑：
· 首先计算水印图片的显示高度 = 封面图高度 * 设置的水印大小 / 40
  比如水印大小设置为 5，则水印图片的高度会缩放为封面图高度的 5/40
· 然后根据水印图片的显示高度，和水印图片的宽高比，计算水印图片的显示宽度`}
            </Typography>
          </Box>
        );
      }
    }

    // Tab 9: NFO
    if (tabId === "nfo") {
      if (cardTitle === "写入 NFO 的字段") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              注：同一字段多个名称可以兼容更多类型版本的媒体库
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" component="div" sx={{ lineHeight: 1.8 }}>
                <p>
                  <strong>标签内容选择：</strong>
                  请勾选写入标签的信息（番号前缀、演员、分辨率、中文字幕、有码/无码、系列、片商、发行商）
                </p>
                <p>
                  <strong>演员名白名单：</strong>仅在白名单内的演员名才会被添加至标签（多个内容以 |
                  分割），留空表示全部添加
                </p>
                <p>
                  <strong>注意：</strong>如果需要繁体，请到「设置」-「翻译」-「标签」，勾选为繁体！
                </p>
              </Typography>
            </Box>
          </Box>
        );
      }
    }

    // Tab 11: 网络
    if (tabId === "network") {
      if (cardTitle === "网络设置") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              支持 http(s), socks5(h) 代理。示例：http://127.0.0.1:7897
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              需要用户名和密码时格式为：schema://username:password@host:port
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "Cookie设置") {
        return (
          <Box sx={{ mt: 1, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>javdb:</strong> 刮削 FC2 需要填写
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>javbus:</strong> 美国节点需要填写，其他节点一般不需要填写，除非提示需
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              component="div"
              sx={{ lineHeight: 1.8, mt: 2, whiteSpace: "pre-line" }}
            >
              {`Cookie 获取方法：
1、使用 Chrome 打开目标网站并登录，在页面空白位置点击鼠标右键，选择「检查」；
2、右侧弹窗顶部选择：「网络」->「全部」，然后刷新当前页面;
3、点击「名称」栏新加载出来的第一个内容 ->「标头」->「请求表头」->「Cookie」;
4、复制 Cookie 对应的全部值填入上面输入框。(不要直接右键点「复制值」!!!! 一定要先用鼠标「手动框选」要复制的全部文字，然后再右键点「复制」!!! 不是「复制值」!!!!)
（注意：Cookie 存在有效期，过期无效时请重新获取。）`}
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "API Token") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              ThePornDB: https://theporndb.net/ 注册登录后，点头像 - API Tokens - CREATE。复制生成的 API Token
              填入此处。
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              该网站的 Hash 值匹配结果可能错误
            </Typography>
          </Box>
        );
      }
      if (cardTitle === "网站设置") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              可在下方设置选定网站的配置。
            </Typography>
            <Typography variant="body2" color="error.main" sx={{ mt: 1, fontWeight: 600 }}>
              ⚠️ 切换网站前需先保存，否则不会生效
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              注意：当前并非所有网站均支持这些配置，某些设置可能无效
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              自定义网址：自定义指定网站的网址，刮削时将用其代替默认网址
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              使用浏览器请求：必须安装 Chrome 浏览器。可处理某些无法获取的网站，内存占用会显著提高
            </Typography>
          </Box>
        );
      }
    }

    // Tab 12: 高级
    if (tabId === "advanced") {
      if (cardTitle === "定时刮削") {
        const switchOn = (formData.switch_on as string[]) || [];
        const timedEnabled = switchOn.includes("timed_scrape");
        const timedInterval = (formData.timed_interval as number) || 60;

        const handleTimedToggle = (checked: boolean) => {
          const newSwitchOn = checked
            ? [...switchOn.filter((s) => s !== "timed_scrape"), "timed_scrape"]
            : switchOn.filter((s) => s !== "timed_scrape");
          handleChange({ formData: { ...formData, switch_on: newSwitchOn } });
        };

        const handleTimedIntervalChange = (value: string) => {
          const numValue = Number.parseInt(value, 10);
          if (!Number.isNaN(numValue) && numValue >= 0) {
            handleChange({ formData: { ...formData, timed_interval: numValue } });
          }
        };

        return (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Checkbox checked={timedEnabled} onChange={(e) => handleTimedToggle(e.target.checked)} />}
                label="每隔"
              />
              <TextField
                type="number"
                value={timedInterval}
                onChange={(e) => handleTimedIntervalChange(e.target.value)}
                size="small"
                disabled={!timedEnabled}
                sx={{ width: 100 }}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <Typography variant="body2" color="text.secondary">
                分钟自动开始刮削（读取配置时开始计时）
              </Typography>
            </Box>
          </Box>
        );
      }

      if (cardTitle === "间歇刮削") {
        const switchOn = (formData.switch_on as string[]) || [];
        const restEnabled = switchOn.includes("rest_scrape");
        const restCount = (formData.rest_count as number) || 10;
        const restTime = (formData.rest_time as number) || 20;

        const handleRestToggle = (checked: boolean) => {
          const newSwitchOn = checked
            ? [...switchOn.filter((s) => s !== "rest_scrape"), "rest_scrape"]
            : switchOn.filter((s) => s !== "rest_scrape");
          handleChange({ formData: { ...formData, switch_on: newSwitchOn } });
        };

        const handleRestCountChange = (value: string) => {
          const numValue = Number.parseInt(value, 10);
          if (!Number.isNaN(numValue) && numValue >= 0) {
            handleChange({ formData: { ...formData, rest_count: numValue } });
          }
        };

        const handleRestTimeChange = (value: string) => {
          const numValue = Number.parseInt(value, 10);
          if (!Number.isNaN(numValue) && numValue >= 0) {
            handleChange({ formData: { ...formData, rest_time: numValue } });
          }
        };

        return (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Checkbox checked={restEnabled} onChange={(e) => handleRestToggle(e.target.checked)} />}
                label="连续刮削"
              />
              <TextField
                type="number"
                value={restCount}
                onChange={(e) => handleRestCountChange(e.target.value)}
                size="small"
                disabled={!restEnabled}
                sx={{ width: 80 }}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <Typography variant="body2" color="text.secondary">
                个后休息
              </Typography>
              <TextField
                type="number"
                value={restTime}
                onChange={(e) => handleRestTimeChange(e.target.value)}
                size="small"
                disabled={!restEnabled}
                sx={{ width: 80 }}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <Typography variant="body2" color="text.secondary">
                秒
              </Typography>
            </Box>
          </Box>
        );
      }

      if (cardTitle === "高级功能") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              配置文件目录：将读取该目录中的配置文件、映射表、水印图片、演员头像等数据，修改后重启程序方可生效
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              保留任务：记住未完成的刮削任务，即使退出或中止，下次仍可继续刮削未完成任务
            </Typography>
          </Box>
        );
      }

      if (cardTitle === "调试模式（日志页面）") {
        return (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            显示刮削过程信息、字段来源信息、字段内容信息，便于排查问题。
          </Typography>
        );
      }
    }

    // Tab 10: 演员
    if (tabId === "actor") {
      if (cardTitle === "Emby/Jellyfin 设置") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              服务器地址：指你的 Emby/Jellyfin 服务器地址，比如：http://192.168.1.5:8096
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              API 密钥创建方法：控制台-&gt;高级-&gt;API 密钥-&gt;添加（APP 名称任意）
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              用户 ID：如果设置，将仅获取指定 Emby/Jellyfin 用户媒体库中的演员
            </Typography>
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
          </Box>
        );
      }
      if (cardTitle === "补全 Emby/Jellyfin 演员信息") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              使用维基百科补全 Emby/Jellyfin 演员信息，包括：演员介绍、资料、简历、生平、Imdb主页等。
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              不存在中文时，翻译日语为中文（不勾选则无中文时使用日语）
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PersonIcon />}
              onClick={handleCompleteActors}
              disabled={completeActors.isPending}
              sx={{ mt: 2 }}
            >
              开始补全
            </Button>
          </Box>
        );
      }
      if (cardTitle === "补全 Emby/Jellyfin 演员头像") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              使用网络头像库或本地头像库，补全 Emby/Jellyfin 演员头像。
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              网络头像库 (Gfriends)：建议 Fork 该项目到你的 Github，当项目故障时，可填写你 Fork 后的项目地址
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              支持优先使用 Graphis.ne.jp 的图片作为演员头像和演员背景；Graphis.ne.jp 提供了演员不同时期的图片。
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PhotoIcon />}
              onClick={handleUpdateActorPhotos}
              disabled={updateActorPhotos.isPending}
              sx={{ mt: 2 }}
            >
              开始补全
            </Button>
          </Box>
        );
      }
      if (cardTitle === "补全 Kodi/Plex/Jvedio 演员头像") {
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              将为待刮削目录的每个视频在同目录创建一个 .actors 文件夹，并将该视频的演员图片放在该文件夹中
            </Typography>
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
              <Grid key={group.title} size={{ xs: 12, lg: group.halfWidth || group.fields.length <= 3 ? 6 : 12 }}>
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
