import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import type { FieldProps } from "@rjsf/utils";
import { useState } from "react";

// 字段名称映射
const FIELD_NAMES: Record<string, string> = {
  title: "标题",
  originaltitle: "原标题",
  outline: "简介",
  originalplot: "原简介",
  actors: "演员",
  all_actors: "全部演员",
  tags: "标签",
  directors: "导演",
  series: "系列",
  studio: "片商",
  publisher: "发行商",
  thumb: "缩略图",
  poster: "封面",
  extrafanart: "剧照",
  trailer: "预告片",
  release: "发行日期",
  runtime: "时长",
  score: "评分",
  wanted: "想看",
};

// 语言选项
const LANGUAGES = [
  { value: "undefined", label: "未定义" },
  { value: "jp", label: "日语" },
  { value: "zh_cn", label: "简体中文" },
  { value: "zh_tw", label: "繁体中文" },
  { value: "en", label: "英语" },
];

// 网站选项
const WEBSITES = [
  "theporndb",
  "official",
  "dmm",
  "javdb",
  "javbus",
  "jav321",
  "airav",
  "avsox",
  "fanza",
  "mgstage",
  "fc2",
  "fc2ppvdb",
  "getchu",
  "dlsite",
];

interface FieldConfig {
  site_prority: string[];
  language: string;
  translate: boolean;
}

type FieldConfigsData = Record<string, FieldConfig>;

/**
 * 字段配置表格组件 - 用于配置每个字段的刮削网站、语言和翻译选项
 */
export function FieldConfigsField(props: FieldProps<FieldConfigsData>) {
  const { formData = {}, onChange } = props;
  const [addingSite, setAddingSite] = useState<string | null>(null);

  const handleSiteAdd = (fieldKey: string, site: string) => {
    const fieldConfig = formData[fieldKey] || { site_prority: [], language: "undefined", translate: true };
    if (!fieldConfig.site_prority.includes(site)) {
      const newConfig = {
        ...fieldConfig,
        site_prority: [...fieldConfig.site_prority, site],
      };
      onChange({ ...formData, [fieldKey]: newConfig });
    }
    setAddingSite(null);
  };

  const handleSiteRemove = (fieldKey: string, site: string) => {
    const fieldConfig = formData[fieldKey];
    if (fieldConfig) {
      const newConfig = {
        ...fieldConfig,
        site_prority: fieldConfig.site_prority.filter((s) => s !== site),
      };
      onChange({ ...formData, [fieldKey]: newConfig });
    }
  };

  const handleLanguageChange = (fieldKey: string, language: string) => {
    const fieldConfig = formData[fieldKey] || { site_prority: [], language: "undefined", translate: true };
    onChange({ ...formData, [fieldKey]: { ...fieldConfig, language } });
  };

  const handleTranslateChange = (fieldKey: string, translate: boolean) => {
    const fieldConfig = formData[fieldKey] || { site_prority: [], language: "undefined", translate: true };
    onChange({ ...formData, [fieldKey]: { ...fieldConfig, translate } });
  };

  // 获取所有已配置的字段
  const configuredFields = Object.keys(formData);
  // 按照 FIELD_NAMES 的顺序排序
  const sortedFields = Object.keys(FIELD_NAMES).filter((f) => configuredFields.includes(f));

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, width: 100 }}>字段</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>来源网站优先级</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 120 }}>语言</TableCell>
            <TableCell sx={{ fontWeight: 600, width: 80, textAlign: "center" }}>翻译</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedFields.map((fieldKey) => {
            const config = formData[fieldKey] || { site_prority: [], language: "undefined", translate: true };
            const fieldName = FIELD_NAMES[fieldKey] || fieldKey;

            return (
              <TableRow key={fieldKey} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                <TableCell>
                  <Tooltip title={fieldKey}>
                    <span>{fieldName}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, alignItems: "center" }}>
                    {config.site_prority.map((site) => (
                      <Chip
                        key={site}
                        label={site.toUpperCase()}
                        size="small"
                        onDelete={() => handleSiteRemove(fieldKey, site)}
                        deleteIcon={<CloseIcon fontSize="small" />}
                      />
                    ))}
                    {addingSite === fieldKey ? (
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <Select
                          value=""
                          onChange={(e) => handleSiteAdd(fieldKey, e.target.value)}
                          onClose={() => setAddingSite(null)}
                          open
                          autoFocus
                        >
                          {WEBSITES.filter((w) => !config.site_prority.includes(w)).map((w) => (
                            <MenuItem key={w} value={w}>
                              {w.toUpperCase()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <IconButton size="small" onClick={() => setAddingSite(fieldKey)}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <FormControl size="small" fullWidth>
                    <Select value={config.language} onChange={(e) => handleLanguageChange(fieldKey, e.target.value)}>
                      {LANGUAGES.map((lang) => (
                        <MenuItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}>
                  <Checkbox
                    checked={config.translate}
                    onChange={(e) => handleTranslateChange(fieldKey, e.target.checked)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
