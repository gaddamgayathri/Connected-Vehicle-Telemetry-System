import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Gauge,
  ThermometerSun,
  ExternalLink,
} from 'lucide-react';

import Topbar from '../components/layout/Topbar';
import VehicleMultiSelect from '../components/common/VehicleMultiSelect';
import SegmentedControl from '../components/common/SegmentedControl';
import TimeRangePicker, {
  computeRange,
  DEFAULT_RANGE,
} from '../components/common/TimeRangePicker';
import LastUpdated from '../components/common/LastUpdated';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import LoadingBlock from '../components/common/LoadingBlock';
import { fetchVehicles, fetchCompare } from '../api/vehicles';

const METRICS = [
  { value: 'speed', label: 'Speed' },
  { value: 'temp', label: 'Engine Temp' },
];

const POLL_MS = 60_000;

export default function AnalyticsPage() {
  const [selected, setSelected] = useState([]);
  const [metric, setMetric] = useState('speed');
  const [range, setRange] = useState(DEFAULT_RANGE);

  const [nowTs] = useState(Date.now);
  const { from, to } = useMemo(
    () => computeRange(range, nowTs),
    [range, nowTs]
  );

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });

  const compareQuery = useQuery({
    queryKey: ['compare', selected, metric, from, to],
    queryFn: () => fetchCompare(selected, metric, from, to),
    enabled: selected.length >= 2,
    refetchInterval: selected.length >= 2 ? POLL_MS : false,
  });

  // The API response contains series, and each series contains points.
  const comparisonData = compareQuery.data;

  const series = Array.isArray(comparisonData?.series)
    ? comparisonData.series
    : [];

  const values = series.flatMap((vehicle) =>
    (Array.isArray(vehicle.points) ? vehicle.points : [])
      .map((point) => Number(point.value))
      .filter((value) => Number.isFinite(value))
  );

  const averageValue = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

  const maximumValue = values.length
    ? Math.max(...values)
    : 0;

  const debugUrl =
    selected.length >= 2
      ? `${import.meta.env.VITE_API_URL || ''}/api/vehicles/compare?ids=${selected.join(',')}&metric=${metric}&from=${from}&to=${to}`
      : null;

  return (
    <>
      <Topbar
        title="Analytics"
        subtitle="Compare performance across multiple vehicles"
        right={
          selected.length >= 2 && (
            <LastUpdated
              ts={compareQuery.dataUpdatedAt}
              fetching={compareQuery.isFetching}
            />
          )
        }
      />

      <div className="p-6 space-y-6">
        <Card>
          <CardBody className="flex flex-wrap items-start gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Vehicles
              </label>
              <VehicleMultiSelect
                vehicles={vehicles}
                values={selected}
                onChange={setSelected}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Metric
              </label>
              <SegmentedControl
                options={METRICS}
                value={metric}
                onChange={setMetric}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Range
              </label>
              <TimeRangePicker value={range} onChange={setRange} />
            </div>

            {debugUrl && (
              <a
                href={debugUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-colors self-end"
                title={debugUrl}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View API Response
              </a>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Vehicle Comparison Summary"
            subtitle={`Comparing ${selected.length} vehicles.`}
          />

          <CardBody>
            {selected.length < 2 ? (
              <EmptyState
                title="Select at least 2 vehicles"
                message="Choose at least two vehicles above to compare their performance."
              />
            ) : compareQuery.isLoading ? (
              <LoadingBlock
                height={200}
                label="Loading comparison data…"
              />
            ) : compareQuery.isError ? (
              <EmptyState
                title="Unable to load comparison"
                message="Please check your backend connection and try again."
              />
            ) : values.length === 0 ? (
              <EmptyState message="No readings available for this selection and time range." />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      {metric === 'temp' ? (
                        <ThermometerSun
                          className="text-amber-500"
                          size={24}
                        />
                      ) : (
                        <Gauge
                          className="text-blue-500"
                          size={24}
                        />
                      )}

                      <span className="text-sm text-slate-500">
                        Average{' '}
                        {metric === 'temp'
                          ? 'Engine Temperature'
                          : 'Speed'}
                      </span>
                    </div>

                    <p className="text-3xl font-semibold">
                      {averageValue.toFixed(1)}
                      <span className="ml-1 text-base font-normal text-slate-500">
                        {metric === 'temp' ? '°C' : 'km/h'}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Activity
                        className="text-purple-500"
                        size={24}
                      />

                      <span className="text-sm text-slate-500">
                        Maximum{' '}
                        {metric === 'temp'
                          ? 'Engine Temperature'
                          : 'Speed'}
                      </span>
                    </div>

                    <p className="text-3xl font-semibold">
                      {maximumValue.toFixed(1)}
                      <span className="ml-1 text-base font-normal text-slate-500">
                        {metric === 'temp' ? '°C' : 'km/h'}
                      </span>
                    </p>
                  </div>
                </div>

                <h3 className="font-semibold mt-6 mb-3">
                  Selected Vehicles
                </h3>

                <div className="flex flex-wrap gap-2">
                  {selected.map((id) => {
                    const vehicle = vehicles.find(
                      (item) =>
                        String(item.vehicleid) === String(id)
                    );

                    return (
                      <span
                        key={id}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm"
                      >
                        {vehicle?.registrationNumber ||
                          vehicle?.registrationnumber ||
                          vehicle?.name ||
                          `Vehicle ${id}`}
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
