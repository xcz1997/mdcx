import {
  Brush as BrushIcon,
  CleaningServices as CleanIcon,
  Folder as FolderIcon,
  Language as LanguageIcon,
  MoreHoriz as MoreIcon,
  Router as NetworkIcon,
  Storage as ServerIcon,
  TextFields as TextIcon,
  Translate as TranslateIcon,
  Web as WebIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Form } from "@rjsf/mui";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import {
  getConfigSchemaOptions,
  getConfigUiSchemaOptions,
  getCurrentConfigOptions,
  updateConfigMutation,
} from "@/client/@tanstack/react-query.gen";
import { fields } from "@/components/form";
import { GridObjectFieldTemplate } from "@/components/form/GridObjectFieldTemplate";
import { useToast } from "@/contexts/ToastProvider";

export const Route = createFileRoute("/settings")({
  component: SettingsComponent,
});

// 分组定义
interface FieldGroup {
  title: string;
  fields: string[];
}

// Tab 配置定义
interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactElement;
  groups: FieldGroup[];
  description: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    id: "general",
    label: "通用",
    icon: <FolderIcon />,
    description: "媒体路径和输出目录设置",
    groups: [
      {
        title: "路径设置",
        fields: ["media_path", "success_output_folder", "failed_output_folder"],
      },
      {
        title: "链接选项",
        fields: ["soft_link", "auto_link", "remain_link"],
      },
      {
        title: "输出目录",
        fields: [
          "output_folder_with_year",
          "output_folder_with_studio",
          "output_folder_escape_studio",
        ],
      },
    ],
  },
  {
    id: "naming",
    label: "命名",
    icon: <TextIcon />,
    description: "文件命名和 NFO 生成规则",
    groups: [
      {
        title: "命名规则",
        fields: [
          "naming_file",
          "naming_media",
          "folder_name",
          "prevent_char",
          "fields_rule",
        ],
      },
      {
        title: "NFO 设置",
        fields: [
          "nfo_title_language",
          "nfo_tagline_language",
          "nfo_tag_language",
          "nfo_genre_language",
          "nfo_include_new_field",
          "nfo_fields",
        ],
      },
      {
        title: "字幕设置",
        fields: ["subtitle_add_chs", "subtitle_add_rescrape"],
      },
      {
        title: "附加文件",
        fields: ["cd_name", "cd_char", "pic_name", "trailer_name"],
      },
      {
        title: "文件夹设置",
        fields: [
          "extrafanart_folder",
          "extrafanart_copy_folder",
          "actor_photo_folder",
          "actor_photo_kodi_style",
        ],
      },
      {
        title: "标签样式",
        fields: [
          "umr_style",
          "leak_style",
          "wuma_style",
          "youma_style",
          "show_moword",
          "show_4k",
        ],
      },
    ],
  },
  {
    id: "scraper",
    label: "爬虫",
    icon: <LanguageIcon />,
    description: "刮削并发数和下载设置",
    groups: [
      {
        title: "并发设置",
        fields: ["thread_number", "thread_time", "javdb_time"],
      },
      {
        title: "刮削模式",
        fields: ["main_mode", "update_mode", "read_mode"],
      },
      {
        title: "链接处理",
        fields: ["soft_prefix", "scrape_softlink", "scrape_hardlink"],
      },
      {
        title: "更新选项",
        fields: ["update_a", "update_b", "update_c", "update_d", "update_e"],
      },
      {
        title: "下载设置",
        fields: [
          "scrape_like",
          "download_hd_pics",
          "download_only_missing_images",
          "download_trailer",
          "download_subtitles",
          "keep_files",
        ],
      },
    ],
  },
  {
    id: "website",
    label: "网站",
    icon: <WebIcon />,
    description: "数据源网站和优先级配置",
    groups: [
      {
        title: "数据源",
        fields: [
          "website_youma",
          "website_wuma",
          "website_guochan",
          "website_oumei",
        ],
      },
      {
        title: "标题设置",
        fields: [
          "title_website",
          "title_language",
          "title_sehua",
          "title_yesjav",
          "title_cnword",
        ],
      },
      {
        title: "简介设置",
        fields: ["outline_source", "outline_language"],
      },
      {
        title: "高级配置",
        fields: ["site_config", "all_sites"],
      },
    ],
  },
  {
    id: "watermark",
    label: "水印",
    icon: <BrushIcon />,
    description: "图片水印和位置设置",
    groups: [
      {
        title: "启用水印",
        fields: ["poster_mark", "thumb_mark", "fanart_mark"],
      },
      {
        title: "水印样式",
        fields: ["mark_size", "mark_type", "mark_fixed"],
      },
      {
        title: "水印位置",
        fields: [
          "mark_pos",
          "mark_pos_corner",
          "mark_pos_sub",
          "mark_pos_hd",
          "mark_pos_mosaic",
        ],
      },
    ],
  },
  {
    id: "clean",
    label: "清理",
    icon: <CleanIcon />,
    description: "文件清理规则和排除条件",
    groups: [
      {
        title: "基本设置",
        fields: ["folders", "string", "file_size", "clean_enable", "del_empty_folder"],
      },
      {
        title: "清理规则",
        fields: ["clean_ext", "clean_name", "clean_contains", "clean_size"],
      },
      {
        title: "排除规则",
        fields: ["clean_ignore_ext", "clean_ignore_contains"],
      },
    ],
  },
  {
    id: "server",
    label: "服务器",
    icon: <ServerIcon />,
    description: "Emby/Jellyfin 媒体服务器集成",
    groups: [
      {
        title: "Emby",
        fields: ["emby_url", "emby_api", "emby_on"],
      },
      {
        title: "Jellyfin",
        fields: ["jellyfin_url", "jellyfin_api", "jellyfin_on"],
      },
      {
        title: "通用设置",
        fields: ["server_type", "server_token"],
      },
      {
        title: "演员照片",
        fields: ["actor_photo_net_drive", "actor_photo_net_path"],
      },
    ],
  },
  {
    id: "network",
    label: "网络",
    icon: <NetworkIcon />,
    description: "代理和网络超时设置",
    groups: [
      {
        title: "代理设置",
        fields: ["proxy_type", "proxy_address"],
      },
      {
        title: "超时设置",
        fields: ["timeout", "retry"],
      },
      {
        title: "API 令牌",
        fields: ["api_token", "theporndb_token", "javbus_cookie"],
      },
    ],
  },
  {
    id: "translate",
    label: "翻译",
    icon: <TranslateIcon />,
    description: "翻译服务配置",
    groups: [
      {
        title: "翻译配置",
        fields: ["translate_config"],
      },
    ],
  },
  {
    id: "other",
    label: "其他",
    icon: <MoreIcon />,
    description: "功能开关和日志设置",
    groups: [
      {
        title: "功能开关",
        fields: ["switch_on", "update_check"],
      },
      {
        title: "定时刮削",
        fields: ["timed_scrape", "timed_interval"],
      },
      {
        title: "休息设置",
        fields: ["rest_scrape", "rest_count", "rest_time"],
      },
      {
        title: "日志设置",
        fields: ["show_web_log", "show_from_log", "save_log"],
      },
      {
        title: "字段配置",
        fields: ["field_config"],
      },
    ],
  },
];

// 根据字段列表过滤 schema
function filterSchemaByFields(
  schema: RJSFSchema,
  fieldList: string[],
): RJSFSchema {
  if (!schema.properties) return schema;

  const filteredProperties: RJSFSchema["properties"] = {};

  for (const field of fieldList) {
    if (schema.properties[field]) {
      filteredProperties[field] = schema.properties[field];
    }
  }

  return {
    ...schema,
    properties: filteredProperties,
    required: (schema.required as string[] | undefined)?.filter((r) =>
      fieldList.includes(r),
    ),
  };
}

// 根据字段列表过滤 uiSchema
function filterUiSchemaByFields(
  uiSchema: UiSchema,
  fieldList: string[],
): UiSchema {
  const filteredUiSchema: UiSchema = {};

  for (const field of fieldList) {
    if (uiSchema[field]) {
      filteredUiSchema[field] = uiSchema[field];
    }
  }

  if (uiSchema["ui:order"]) {
    filteredUiSchema["ui:order"] = (uiSchema["ui:order"] as string[]).filter(
      (f) => fieldList.includes(f) || f === "*",
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

// 单个分组卡片组件
interface GroupCardProps {
  group: FieldGroup;
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formData: Record<string, unknown>;
  onChange: (data: { formData?: Record<string, unknown> }) => void;
}

function GroupCard({
  group,
  schema,
  uiSchema,
  formData,
  onChange,
}: GroupCardProps) {
  const filteredSchema = useMemo(
    () => filterSchemaByFields(schema, group.fields),
    [schema, group.fields],
  );

  const filteredUiSchema = useMemo(
    () => filterUiSchemaByFields(uiSchema, group.fields),
    [uiSchema, group.fields],
  );

  const hasVisibleFields =
    filteredSchema.properties &&
    Object.keys(filteredSchema.properties).length > 0;

  if (!hasVisibleFields) return null;

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ mb: 2, color: "primary.main" }}
        >
          {group.title}
        </Typography>
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
      </CardContent>
    </Card>
  );
}

function SettingsComponent() {
  const { showSuccess, showError } = useToast();
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const configQ = useQuery(getCurrentConfigOptions());
  const schemaQ = useQuery(getConfigSchemaOptions());
  const uiSchemaQ = useQuery(getConfigUiSchemaOptions());

  const updateConfig = useMutation(updateConfigMutation());

  // 初始化 formData
  useMemo(() => {
    if (configQ.isSuccess && configQ.data) {
      setFormData(configQ.data as Record<string, unknown>);
    }
  }, [configQ.isSuccess, configQ.data]);

  // 处理表单数据变化
  const handleChange = useCallback(
    (data: { formData?: Record<string, unknown> }) => {
      if (data.formData) {
        setFormData((prev) => ({ ...prev, ...data.formData }));
        setHasChanges(true);
      }
    },
    [],
  );

  // 处理保存
  const handleSubmit = useCallback(async () => {
    try {
      await updateConfig.mutateAsync({ body: formData });
      showSuccess("设置已保存");
      setHasChanges(false);
    } catch (error) {
      showError(`保存失败: ${error}`);
    }
  }, [formData, updateConfig, showSuccess, showError]);

  const currentTabConfig = TAB_CONFIGS[currentTab];

  if (!schemaQ.isSuccess || !configQ.isSuccess || !uiSchemaQ.isSuccess) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  const schema = schemaQ.data as RJSFSchema;
  const uiSchema = uiSchemaQ.data as UiSchema;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* 页面标题 */}
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
          <Typography variant="body2" color="text.secondary">
            {currentTabConfig.description}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {hasChanges && (
            <Typography variant="body2" color="warning.main">
              有未保存的更改
            </Typography>
          )}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!hasChanges}
          >
            保存设置
          </Button>
        </Box>
      </Box>

      {/* Tab 导航 */}
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
              minHeight: 56,
            },
          }}
        >
          {TAB_CONFIGS.map((tab, index) => (
            <Tab
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
              id={`settings-tab-${index}`}
              aria-controls={`settings-tabpanel-${index}`}
              sx={{
                gap: 1,
                px: 2,
              }}
            />
          ))}
        </Tabs>
      </Card>

      {/* Tab 内容 - 分组卡片 */}
      {TAB_CONFIGS.map((tab, index) => (
        <TabPanel key={tab.id} value={currentTab} index={index}>
          <Grid container spacing={3}>
            {tab.groups.map((group) => (
              <Grid key={group.title} size={{ xs: 12, md: 6 }}>
                <GroupCard
                  group={group}
                  schema={schema}
                  uiSchema={uiSchema}
                  formData={formData}
                  onChange={handleChange}
                />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      ))}
    </Box>
  );
}
