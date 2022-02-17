import React from 'react';
import styled from '@emotion/styled';

import Button from 'sentry/components/button';
import Field from 'sentry/components/forms/field';
import {IconAdd, IconDelete} from 'sentry/icons';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {
  aggregateFunctionOutputType,
  isLegalYAxisType,
  QueryFieldValue,
} from 'sentry/utils/discover/fields';
import {QueryField} from 'sentry/views/eventsV2/table/queryField';
import {FieldValueKind} from 'sentry/views/eventsV2/table/types';
import {generateFieldOptions} from 'sentry/views/eventsV2/utils';

import {DisplayType, Widget, WidgetType} from '../types';

type Props = {
  displayType: DisplayType;
  fieldOptions: ReturnType<typeof generateFieldOptions>;
  fields: QueryFieldValue[];
  /**
   * Fired when fields are added/removed/modified/reordered.
   */
  onChange: (fields: QueryFieldValue[]) => void;
  widgetType: Widget['widgetType'];
  errors?: Record<string, any>;
  style?: React.CSSProperties;
};

function YAxisSelector({
  displayType,
  fields,
  style,
  fieldOptions,
  onChange,
  widgetType,
  errors,
}: Props) {
  const isMetricWidget = widgetType === WidgetType.METRICS;

  function handleAdd(event: React.MouseEvent) {
    event.preventDefault();

    const newFields = [
      ...fields,
      {kind: FieldValueKind.FIELD, field: ''} as QueryFieldValue,
    ];
    onChange(newFields);
  }

  function handleAddEquation(event: React.MouseEvent) {
    event.preventDefault();

    const newFields = [
      ...fields,
      {kind: FieldValueKind.EQUATION, field: ''} as QueryFieldValue,
    ];
    onChange(newFields);
  }

  function handleRemove(event: React.MouseEvent, fieldIndex: number) {
    event.preventDefault();

    const newFields = [...fields];
    newFields.splice(fieldIndex, 1);
    onChange(newFields);
  }

  function handleChangeField(value: QueryFieldValue, fieldIndex: number) {
    const newFields = [...fields];
    newFields[fieldIndex] = value;
    onChange(newFields);
  }

  // Any function/field choice for Big Number widgets is legal since the
  // data source is from an endpoint that is not timeseries-based.
  // The function/field choice for World Map widget will need to be numeric-like.
  // Column builder for Table widget is already handled above.
  const doNotValidateYAxis = displayType === 'big_number';

  function filterPrimaryOptions(option) {
    // Only validate function names for timeseries widgets and
    // world map widgets.
    if (!doNotValidateYAxis && option.value.kind === FieldValueKind.FUNCTION) {
      const primaryOutput = aggregateFunctionOutputType(
        option.value.meta.name,
        undefined
      );
      if (primaryOutput) {
        // If a function returns a specific type, then validate it.
        return isLegalYAxisType(primaryOutput);
      }
    }

    if (
      widgetType === WidgetType.METRICS &&
      (displayType === DisplayType.TABLE || displayType === DisplayType.TOP_N)
    ) {
      return (
        option.value.kind === FieldValueKind.FUNCTION ||
        option.value.kind === FieldValueKind.TAG
      );
    }

    return option.value.kind === FieldValueKind.FUNCTION;
  }

  const filterAggregateParameters = fieldValue => option => {
    // Only validate function parameters for timeseries widgets and
    // world map widgets.
    if (doNotValidateYAxis) {
      return true;
    }

    if (fieldValue.kind !== 'function') {
      return true;
    }

    if (isMetricWidget) {
      return true;
    }

    const functionName = fieldValue.function[0];
    const primaryOutput = aggregateFunctionOutputType(
      functionName as string,
      option.value.meta.name
    );
    if (primaryOutput) {
      return isLegalYAxisType(primaryOutput);
    }

    if (option.value.kind === FieldValueKind.FUNCTION) {
      // Functions are not legal options as an aggregate/function parameter.
      return false;
    }

    return isLegalYAxisType(option.value.meta.dataType);
  };

  const canDelete = fields.length > 1;

  const hideAddYAxisButton =
    ([DisplayType.WORLD_MAP, DisplayType.BIG_NUMBER].includes(displayType) &&
      fields.length === 1) ||
    ([
      DisplayType.LINE,
      DisplayType.AREA,
      DisplayType.STACKED_AREA,
      DisplayType.BAR,
    ].includes(displayType) &&
      fields.length === 3);

  return (
    <Field
      data-test-id="y-axis"
      label={t('Y-Axis')}
      inline={false}
      style={{padding: `${space(2)} 0 24px 0`, ...(style ?? {})}}
      flexibleControlStateSize
      error={errors?.fields}
      required
      stacked
    >
      {fields.map((field, i) => {
        return (
          <QueryFieldWrapper key={`${field}:${i}`}>
            <QueryField
              fieldValue={field}
              fieldOptions={fieldOptions}
              onChange={value => handleChangeField(value, i)}
              filterPrimaryOptions={filterPrimaryOptions}
              filterAggregateParameters={filterAggregateParameters(field)}
              otherColumns={fields}
            />
            {(canDelete || field.kind === 'equation') && (
              <Button
                size="zero"
                borderless
                onClick={event => handleRemove(event, i)}
                icon={<IconDelete />}
                title={t('Remove this Y-Axis')}
                aria-label={t('Remove this Y-Axis')}
              />
            )}
          </QueryFieldWrapper>
        );
      })}
      {!hideAddYAxisButton && (
        <Actions>
          <Button size="small" icon={<IconAdd isCircled />} onClick={handleAdd}>
            {t('Add Overlay')}
          </Button>
          <Button
            size="small"
            aria-label={t('Add an Equation')}
            onClick={handleAddEquation}
            icon={<IconAdd isCircled />}
          >
            {t('Add an Equation')}
          </Button>
        </Actions>
      )}
    </Field>
  );
}

export default YAxisSelector;

const Actions = styled('div')`
  & button {
    margin-right: ${space(1)};
  }
`;

const QueryFieldWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${space(1)};

  > * + * {
    margin-left: ${space(1)};
  }
`;
