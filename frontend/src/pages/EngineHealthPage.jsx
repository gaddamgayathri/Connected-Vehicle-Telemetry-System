import {
  AlertTriangle,
  ThermometerSun,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Topbar from '../components/layout/Topbar';
import VehicleSelector from '../components/common/VehicleSelector';
import TimeRangePicker, { computeRange, DEFAULT_RANGE } from '../components/common/TimeRangePicker';
import LastUpdated from '../components/common/LastUpdated';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import KpiCard from '../components/common/KpiCard';
import EmptyState from '../components/common/EmptyState';
import LoadingBlock from '../components/common/LoadingBlock';
import TemperatureHistoryChart from '../components/engine/TemperatureHistoryChart';
import { fetchVehicles, fetchTemperatureHistory } from '../api/vehicles';
import { TEMP_THRESHOLDS } from '../lib/constants';
import { fmtTemp } from '../lib/formatters';

const POLL_MS = 60_000;

function getTemperatureStatus(temp) {
  if (temp > TEMP_THRESHOLDS.WARNING) {
    return { label: 'Abnormal', color: 'text-red-600 bg-red-50' };
  }

  if (temp > TEMP_THRESHOLDS.NORMAL_MAX) {
    return { label: 'Warning', color: 'text-amber-600 bg-amber-50' };
  }

  return { label: 'Normal', color: 'text-green-600 bg-green-50' };
}

export default function EngineHealthPage() {
  const [vehicleId, setVehicleId] = useState(null);
  const [range, setRange] = useState(DEFAULT_RANGE);

  const [nowTs] = useState(Date.now);
  const { from, to } = useMemo(() => computeRange(range, nowTs), [range, nowTs]);

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });

  useEffect(() => {
    if (!vehicleId && vehicles.length) setVehicleId(vehicles[0].vehicleid);
  }, [vehicles, vehicleId]);

  const tempQuery = useQuery({
    queryKey: ['temp-history', vehicleId, from, to],
    queryFn: () => fetchTemperatureHistory(vehicleId, from, to),
    enabled: !!vehicleId,
    refetchInterval: POLL_MS,
  });

  const data = tempQuery.data || [];
  const breaches = data.filter((d) => d.engineTemp >= TEMP_THRESHOLDS.WARNING).length;
  const peakTemp = data.reduce((m, d) => Math.max(m, d.engineTemp), 0);
  const avgTemp =
    data.length > 0 ? data.reduce((s, d) => s + d.engineTemp, 0) / data.length : 0;

  return (
    <>
      <Topbar
        title="Engine Health"
        subtitle="Engine temperature diagnostics and threshold monitoring"
        right={
          <div className="flex items-center gap-3">
            <LastUpdated ts={tempQuery.dataUpdatedAt} fetching={tempQuery.isFetching} />
            <VehicleSelector vehicles={vehicles} value={vehicleId} onChange={setVehicleId} />
          </div>
        }
      />
      <div className="p-6 space-y-6">
        {!vehicleId ? (
          <EmptyState title="No vehicles available" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard
                label="Peak Temp"
                value={fmtTemp(peakTemp)}
                icon={ThermometerSun}
                accent={peakTemp >= TEMP_THRESHOLDS.WARNING ? 'red' : 'amber'}
              />
              <KpiCard label="Avg Temp" value={fmtTemp(avgTemp)} icon={Activity} accent="brand" />
              <KpiCard
                label="Threshold Breaches"
                value={breaches}
                hint={`Above ${TEMP_THRESHOLDS.WARNING}°C`}
                icon={AlertTriangle}
                accent={breaches > 0 ? 'red' : 'green'}
              />
            </div>

             
<Card>
  <CardHeader
    title="Engine Health Status"
    subtitle="Temperature status based on your configured demo thresholds."
    action={<TimeRangePicker value={range} onChange={setRange} />}
  />
  <CardBody>
    {tempQuery.isLoading ? (
      <LoadingBlock height={200} label="Loading temperature data…" />
    ) : data.length === 0 ? (
      <EmptyState message="No temperature readings in this range." />
    ) : (
      <>
        {(() => {
          const latest = data.reduce((a, b) =>
            new Date(a.ts).getTime() > new Date(b.ts).getTime() ? a : b
          );
          const status = getTemperatureStatus(latest.engineTemp);
          const StatusIcon =
            status.label === 'Normal'
              ? CheckCircle
              : status.label === 'Warning'
                ? AlertTriangle
                : XCircle;

          return (
            <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <StatusIcon
                  className={
                    status.label === 'Normal'
                      ? 'text-green-600'
                      : status.label === 'Warning'
                        ? 'text-amber-600'
                        : 'text-red-600'
                  }
                  size={28}
                />
                <div>
                  <p className="text-sm text-slate-500">Latest engine temperature</p>
                  <p className="text-xl font-semibold">
                    {fmtTemp(latest.engineTemp)}
                  </p>
                </div>
                <span className={`ml-auto rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })()}

        <h3 className="font-semibold mb-3">Recent Temperature Readings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 border-b dark:border-slate-700">
              <tr>
                <th className="py-3 pr-4">Time</th>
                <th className="py-3 pr-4">Temperature</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...data]
                .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
                .slice(0, 10)
                .map((reading, index) => {
                  const status = getTemperatureStatus(reading.engineTemp);

                  return (
                    <tr
                      key={`${reading.ts}-${index}`}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {new Date(reading.ts).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        {fmtTemp(reading.engineTemp)}
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </>
    )}
  </CardBody>
</Card>

          </>
        )}
      </div>
    </>
  );
}
