import CompactSelect from 'sentry/components/compactSelect';

export default {
  title: 'Components/Compact Select',
};

export const Default = ({}) => {
  return (
    <div className="clearfix" style={{display: 'flex', gap: 12}}>
      <CompactSelect
        name="select"
        label="Select Field"
        triggerProps={{
          prefix: 'Filter',
        }}
        isClearable
        isSearchable
        menuTitle="Filter"
        defaultValue="woop"
        options={[
          {value: 'woop', label: 'Whale Shark'},
          {value: 'skeedoop', label: 'Sperm Whale'},
          {value: 'kahoop', label: 'Giant Manta Ray'},
          {value: 'bloop', label: "Lion's Mane Jelly"},
        ]}
      />
      <CompactSelect
        name="select"
        label="Select Field"
        triggerProps={{
          prefix: 'Filter',
        }}
        multiple
        isSearchable
        isClearable
        menuTitle="Filter"
        defaultValue={['woop', 'skeedoop']}
        options={[
          {value: 'woop', label: 'Whale Shark'},
          {value: 'skeedoop', label: 'Sperm Whale'},
          {value: 'kahoop', label: 'Giant Manta Ray'},
          {value: 'bloop', label: "Lion's Mane Jelly"},
        ]}
      />
    </div>
  );
};

Default.storyName = 'Default';
