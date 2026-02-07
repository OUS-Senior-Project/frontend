import { render, screen } from '@testing-library/react';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  ChartStyle,
  getPayloadConfigFromPayload,
} from '@/components/ui/chart';

const IconMock = () => <svg data-testid="icon" />;

const configWithColors = {
  series: { label: 'Series Label', color: 'red', icon: IconMock },
  alt: {
    label: 'Alt Label',
    theme: { light: 'blue', dark: 'green' },
  },
};

const configWithoutColors = {
  series: { label: 'Series Label' },
};

const configPartialTheme = {
  partial: { label: 'Partial', theme: { light: 'orange' } as any },
};

const configValueKey = {
  value: { label: 'Value Label', color: 'purple' },
};

describe('Chart components', () => {
  test('ChartStyle returns null when no colors are configured', () => {
    const { container } = render(
      <ChartStyle id="chart-test" config={configWithoutColors} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('ChartStyle handles partial theme colors', () => {
    const { container } = render(
      <ChartStyle id="chart-partial" config={configPartialTheme as any} />
    );
    expect(container.querySelector('style')).toBeInTheDocument();
  });

  test('ChartContainer renders style with colors', () => {
    const { container } = render(
      <ChartContainer config={configWithColors}>
        <div>Chart body</div>
      </ChartContainer>
    );
    expect(container.querySelector('style')).toBeInTheDocument();
  });

  test('ChartTooltipContent throws without provider', () => {
    expect(() =>
      render(<ChartTooltipContent active payload={[]} />)
    ).toThrow('useChart must be used within a <ChartContainer />');
  });

  test('ChartTooltipContent handles active payload with formatter', () => {
    render(
      <ChartContainer config={configWithColors}>
        <ChartTooltipContent
          active
          indicator="line"
          nameKey="series"
          payload={[
            {
              name: 'Series',
              dataKey: 'series',
              value: 100,
              payload: { fill: '#f00' },
              series: 'series',
            },
          ]}
          label="series"
          labelFormatter={(value) => `Label: ${value}`}
        />
      </ChartContainer>
    );

    expect(screen.getByText('Label: Series Label')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  test('ChartTooltipContent returns null when inactive or label missing', () => {
    const { rerender } = render(
      <ChartContainer config={configWithColors}>
        <ChartTooltipContent
          active={false}
          payload={[{ name: 'Series', dataKey: 'series', value: 1, payload: {} }]}
        />
      </ChartContainer>
    );

    expect(screen.queryByText('Series Label')).not.toBeInTheDocument();

    rerender(
      <ChartContainer config={configWithColors}>
        <ChartTooltipContent
          active
          labelKey="missing"
          payload={[{ name: 'Unknown', dataKey: 'unknown', value: 5, payload: {} }]}
        />
      </ChartContainer>
    );

    expect(screen.queryByText('Series Label')).not.toBeInTheDocument();
  });

  test('ChartTooltipContent uses name fallback and label string', () => {
    render(
      <ChartContainer config={configWithColors}>
        <ChartTooltipContent
          active
          label="MissingLabel"
          payload={[{ name: 'Series', value: 10, payload: {} }]}
        />
      </ChartContainer>
    );

    expect(screen.getByText('MissingLabel')).toBeInTheDocument();
  });

  test('ChartTooltipContent falls back to value key', () => {
    render(
      <ChartContainer config={configValueKey}>
        <ChartTooltipContent
          active
          payload={[{ value: 5, payload: {} }]}
        />
      </ChartContainer>
    );

    expect(screen.getAllByText('Value Label').length).toBeGreaterThan(0);
  });

  test('ChartTooltipContent supports dashed indicator and hideIndicator', () => {
    const { container } = render(
      <ChartContainer config={configWithColors}>
        <ChartTooltipContent
          active
          indicator="dashed"
          hideLabel
          hideIndicator
          payload={[
            {
              name: 'Alt',
              dataKey: 'alt',
              value: 0,
              payload: { fill: '#0f0' },
              alt: 'series',
            },
            {
              name: 'Series',
              dataKey: 'series',
              value: 200,
              payload: { fill: '#f00' },
            },
          ]}
        />
      </ChartContainer>
    );

    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  });

  test('ChartTooltipContent renders indicator and value', () => {
    const { container } = render(
      <ChartContainer config={configWithColors}>
        <ChartTooltipContent
          active
          indicator="dashed"
          color="#123456"
          payload={[
            {
              dataKey: 'alt',
              value: 150,
              payload: { fill: '#0f0' },
            },
          ]}
        />
      </ChartContainer>
    );

    expect(container.querySelector('[data-slot="chart"]')).toBeInTheDocument();
  });

  test('ChartTooltipContent supports custom formatter', () => {
    render(
      <ChartContainer config={configWithColors}>
        <ChartTooltipContent
          active
          payload={[
            {
              name: 'Series',
              dataKey: 'series',
              value: 100,
              payload: { fill: '#f00' },
            },
          ]}
          formatter={() => <span>Formatted</span>}
        />
      </ChartContainer>
    );

    expect(screen.getByText('Formatted')).toBeInTheDocument();
  });

  test('ChartLegendContent renders and supports hideIcon', () => {
    const { rerender } = render(
      <ChartContainer config={configWithColors}>
        <ChartLegendContent payload={[]} />
      </ChartContainer>
    );

    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();

    rerender(
      <ChartContainer config={configWithColors}>
        <ChartLegendContent
          payload={[{ value: 'Series', dataKey: 'series', color: '#f00' }]}
        />
      </ChartContainer>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();

    rerender(
      <ChartContainer config={configWithColors}>
        <ChartLegendContent
          hideIcon
          payload={[
            {
              value: 'Alt',
              dataKey: 'alt',
              color: '#0f0',
              payload: { alt: 'series' },
            },
          ]}
        />
      </ChartContainer>
    );

    rerender(
      <ChartContainer config={configWithColors}>
        <ChartLegendContent
          verticalAlign="top"
          nameKey="nameKey"
          payload={[
            { value: 'Series', dataKey: 'series', color: '#f00', nameKey: 'series' },
          ]}
        />
      </ChartContainer>
    );

    rerender(
      <ChartContainer config={configWithColors}>
        <ChartLegendContent payload={[{ value: 'Value', color: '#333' } as any]} />
      </ChartContainer>
    );
  });

  test('ChartTooltip and ChartLegend render', () => {
    const { container } = render(
      <ChartContainer config={configWithColors}>
        <ChartTooltip />
        <ChartLegend />
      </ChartContainer>
    );
    expect(container.querySelector('[data-recharts="Tooltip"]')).toBeInTheDocument();
    expect(container.querySelector('[data-recharts="Legend"]')).toBeInTheDocument();
  });

  test('getPayloadConfigFromPayload handles non-objects safely', () => {
    expect(getPayloadConfigFromPayload(configWithColors, 'bad' as any, 'series')).toBeUndefined();
  });
});
