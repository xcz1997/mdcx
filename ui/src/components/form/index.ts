import type { RegistryFieldsType } from "@rjsf/utils";
import { CustomArrayField } from "./ChipArrayField";
import { CustomStringField } from "./CustomStringField";
import { FieldConfigsField } from "./FieldConfigsField";
import { ServerPathField } from "./ServerPathField";
import { SliderField } from "./SliderField";

export const fields: RegistryFieldsType = {
  ArrayField: CustomArrayField,
  StringField: CustomStringField,
  serverPath: ServerPathField,
  slider: SliderField,
  fieldConfigs: FieldConfigsField,
};
