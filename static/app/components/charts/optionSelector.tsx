import styled from '@emotion/styled';

import {InlineContainer, SectionHeading} from 'sentry/components/charts/styles';
import FeatureBadge from 'sentry/components/featureBadge';
import CompactSelect from 'sentry/components/forms/compactSelect';
import {SelectValue} from 'sentry/types';
import {defined} from 'sentry/utils';

type Props = {
  onChange: (value: string) => void;
  options: SelectValue<string>[];
  selected: string;
  title: string;
  featureType?: 'alpha' | 'beta' | 'new';
};

function OptionSelector(props: Props) {
  const {options, onChange, selected, title, featureType} = props;

  return (
    <InlineContainer>
      <SectionHeading>
        {title}
        {defined(featureType) ? <StyledFeatureBadge type={featureType} /> : null}
      </SectionHeading>
      <CompactSelect
        triggerProps={{
          size: 'small',
        }}
        placement="bottom right"
        offset={4}
        value={selected}
        defaultValue={options[0]?.value}
        onChange={opt => onChange(opt.value)}
        options={options}
        isOptionDisabled={opt => opt.disabled}
      />
    </InlineContainer>
  );
}

const StyledFeatureBadge = styled(FeatureBadge)`
  margin-left: 0px;
`;

export default OptionSelector;
