import { Grid } from "@mui/material";
import type { ObjectFieldTemplateProps, RJSFSchema } from "@rjsf/utils";
import type { ReactElement } from "react";

/**
 * 判断字段是否应该占用整行
 * - 数组类型
 * - 对象类型
 * - 多行文本
 * - 特定的长字段名
 */
function shouldBeFullWidth(
  name: string,
  schema: { type?: string | string[]; format?: string },
  uiSchema?: { "ui:widget"?: string; "ui:options"?: { rows?: number } },
): boolean {
  // 数组和对象占整行
  if (schema.type === "array" || schema.type === "object") {
    return true;
  }

  // 多行文本框占整行
  if (uiSchema?.["ui:widget"] === "textarea") {
    return true;
  }
  if (uiSchema?.["ui:options"]?.rows && uiSchema["ui:options"].rows > 1) {
    return true;
  }

  // 特定的长字段名占整行（路径类字段）
  const fullWidthFields = [
    "media_path",
    "success_output_folder",
    "failed_output_folder",
    "extrafanart_folder",
    "extrafanart_copy_folder",
    "actor_photo_folder",
    "actor_photo_net_path",
  ];

  if (fullWidthFields.includes(name)) {
    return true;
  }

  return false;
}

/**
 * 从 prop 中提取 schema
 */
function getFieldSchema(content: ReactElement): RJSFSchema {
  const props = content.props as { schema?: RJSFSchema } | undefined;
  return props?.schema || {};
}

/**
 * Grid 布局的 ObjectFieldTemplate
 * 短字段并排显示，长字段占整行
 * 注意：不渲染 title 和 description，因为外层卡片已经有标题
 */
export function GridObjectFieldTemplate(props: ObjectFieldTemplateProps) {
  const { properties, uiSchema } = props;

  return (
    <Grid container spacing={2}>
      {properties.map((prop) => {
        const fieldUiSchema = uiSchema?.[prop.name] as
          | { "ui:widget"?: string; "ui:options"?: { rows?: number } }
          | undefined;
        const fieldSchema = getFieldSchema(prop.content);
        const isFullWidth = shouldBeFullWidth(prop.name, fieldSchema, fieldUiSchema);

        return (
          <Grid
            key={prop.name}
            size={{
              xs: 12,
              sm: isFullWidth ? 12 : 6,
              md: isFullWidth ? 12 : 6,
              lg: isFullWidth ? 12 : 6,
            }}
          >
            {prop.content}
          </Grid>
        );
      })}
    </Grid>
  );
}
