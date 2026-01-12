"use client";

import React from "react";
import { PropertyDefinition } from "@/lib/model/schema";
import { TextCell } from "./TextCell";
import { NumberCell } from "./NumberCell";
import { CheckboxCell } from "./CheckboxCell";
import { SelectCell } from "./SelectCell";
import { MultiSelectCell } from "./MultiSelectCell";

interface PropertyCellProps {
  property: PropertyDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function PropertyCell({ property, value, onChange }: PropertyCellProps) {
  const { propertyType } = property;

  switch (propertyType.type) {
    case "text":
      return (
        <TextCell
          value={value as string | undefined}
          onChange={onChange}
        />
      );
    case "number":
      return (
        <NumberCell
          value={value as number | undefined}
          onChange={onChange}
        />
      );
    case "checkbox":
      return (
        <CheckboxCell
          value={value as boolean | undefined}
          onChange={onChange}
        />
      );
    case "select":
      return (
        <SelectCell
          value={value as string | undefined}
          options={propertyType.options}
          onChange={onChange}
        />
      );
    case "multi-select":
      return (
        <MultiSelectCell
          value={value as string[] | undefined}
          options={propertyType.options}
          onChange={onChange}
        />
      );
    default:
      return <span className="text-sm text-muted-foreground">-</span>;
  }
}

export { TextCell } from "./TextCell";
export { NumberCell } from "./NumberCell";
export { CheckboxCell } from "./CheckboxCell";
export { SelectCell } from "./SelectCell";
export { MultiSelectCell } from "./MultiSelectCell";
