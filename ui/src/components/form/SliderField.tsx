import { Box, Slider, Typography } from "@mui/material";
import type { FieldProps } from "@rjsf/utils";

interface SliderCustomProps {
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * 滑块输入字段组件 - 复刻 Qt5 GUI 的滑块控件
 * 用于数值范围选择，如并发数、超时时间、重试次数等
 */
export function SliderField(props: FieldProps<number>) {
  const { schema, formData, onChange, name, uiSchema } = props;

  // 从 uiSchema 或 schema 中获取配置
  const customProps = (uiSchema?.customProps || {}) as SliderCustomProps;
  const min = customProps.min ?? (schema.minimum as number | undefined) ?? 0;
  const max = customProps.max ?? (schema.maximum as number | undefined) ?? 100;
  const step = customProps.step ?? 1;
  const unit = customProps.unit ?? "";

  const value = formData ?? min;
  const title = schema.title || name;

  const handleChange = (_event: Event, newValue: number | number[]) => {
    onChange(newValue as number);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography
          variant="body1"
          fontWeight={600}
          sx={{
            minWidth: 60,
            textAlign: "right",
            color: "primary.main",
            fontFamily: "monospace",
          }}
        >
          {value}
          {unit}
        </Typography>
      </Box>
      <Slider
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        valueLabelDisplay="auto"
        sx={{
          "& .MuiSlider-thumb": {
            width: 16,
            height: 16,
          },
          "& .MuiSlider-track": {
            height: 6,
          },
          "& .MuiSlider-rail": {
            height: 6,
          },
        }}
      />
      {schema.description && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          {schema.description}
        </Typography>
      )}
    </Box>
  );
}
