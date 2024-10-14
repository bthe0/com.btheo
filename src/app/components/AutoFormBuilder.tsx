import React from "react";
import Input from "./Input";
import { ValidationSchema } from "./FormProvider";

interface AutoFormBuilderProps {
  schema: ValidationSchema;
}

const AutoFormBuilder: React.FC<AutoFormBuilderProps> = ({ schema }) => {
  return (
    <>
      {Object.entries(schema).map(([name, fieldSchema]) => {
        const { type, options, ...others } = fieldSchema;
        const label = name.charAt(0).toUpperCase() + name.slice(1);

        switch (type) {
          case "text":
          case "password":
          case "email":
          case "number":
          case "textarea":
            return (
              <Input
                key={name}
                type={type}
                name={name}
                label={label}
                {...others}
              />
            );
          case "select":
            return (
              <Input
                key={name}
                type="select"
                name={name}
                label={label}
                options={options}
                {...others}
              />
            );
          case "checkbox":
            return (
              <Input
                key={name}
                type="checkbox"
                name={name}
                label={label}
                {...others}
              />
            );
          case "radio":
            return options?.map((option) => (
              <Input
                key={`${name}-${option.value}`}
                type="radio"
                name={name}
                label={option.label}
                value={option.value}
                {...others}
              />
            ));
          case "file":
            return (
              <Input
                key={name}
                type="file"
                name={name}
                label={label}
                {...others}
              />
            );
          case "date":
          case "time":
          case "datetime":
            return (
              <Input
                key={name}
                type={type}
                name={name}
                label={label}
                {...others}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
};

export default AutoFormBuilder;
