
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import Topbar from '../components/layout/Topbar';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import LoadingBlock from '../components/common/LoadingBlock';
import EmptyState from '../components/common/EmptyState';
import {
  fetchAdminClients,
  fetchClientVehicles,
  createVehicleForClient,
  deleteAdminClient,
  deleteClientVehicle,
  fetchPendingClients,
  approveClient,
  rejectClient,
} from '../api/admin';

const CURRENT_YEAR = new Date().getFullYear();

const FUEL_TYPES = ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID'];
const VEHICLE_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

function statusBadge(status) {
  const base = 'text-xs px-2 py-0.5 rounded-full font-medium';

  if (status === 'ACTIVE') {
    return (
      <span className={`${base} bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300`}>
        Active
      </span>
    );
  }

  if (status === 'INACTIVE') {
    return (
      <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
        Inactive
      </span>
    );
  }

  return (
    <span className={`${base} bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300`}>
      {status}
    </span>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  maxLength,
  error,
  required,
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-md focus:outline-none focus:ring-2 text-slate-900 dark:text-slate-100 transition-colors ${
          error
            ? 'border border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500'
            : 'border border-slate-200 dark:border-slate-700 focus:ring-brand-500/30 focus:border-brand-500'
        }`}
      />

      {error && (
        <span className="block text-[11px] text-red-500 dark:text-red-400 mt-1">
          {error}
        </span>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, error, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-md focus:outline-none focus:ring-2 text-slate-900 dark:text-slate-100 transition-colors ${
          error
            ? 'border border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500'
            : 'border border-slate-200 dark:border-slate-700 focus:ring-brand-500/30 focus:border-brand-500'
        }`}
      >
        {options.map((option) => (
          <option
            key={typeof option === 'string' ? option : option.value}
            value={typeof option === 'string' ? option : option.value}
          >
            {typeof option === 'string' ? option : option.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="block text-[11px] text-red-500 dark:text-red-400 mt-1">
          {error}
        </span>
      )}
    </div>
  );
}

function AddVehicleModal({ client, onClose }) {
  const qc = useQueryClient();

  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [fuelType, setFuelType] = useState('DIESEL');
  const [vehicleStatus, setVehicleStatus] = useState('ACTIVE');
  const [name, setName] = useState('');
  const [errs, setErrs] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ id, payload }) => createVehicleForClient(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-vehicles', client.userId] });
      qc.invalidateQueries({ queryKey: ['admin-fleet'] });
      setDone(true);
    },
    onError: (err) => {
      setServerErr(err?.response?.data?.message || 'Failed to add vehicle');
    },
  });

  function validate() {
    const errors = {};

    if (!plate.trim()) errors.plate = 'Registration plate is required.';
    if (!make.trim()) errors.make = 'Make is required.';
    if (!model.trim()) errors.model = 'Model is required.';

    const parsedYear = parseInt(year, 10);

    if (
      !year ||
      Number.isNaN(parsedYear) ||
      parsedYear < 1900 ||
      parsedYear > CURRENT_YEAR + 1
    ) {
      errors.year = `Year must be between 1900 and ${CURRENT_YEAR + 1}.`;
    }

    setErrs(errors);
    return Object.keys(errors).length === 0;
  }

  function submit(e) {
    e.preventDefault();

    if (!validate()) return;

    setServerErr('');

    mutation.mutate({
      id: client.userId,
      payload: {
        registrationPlate: plate.trim().toUpperCase(),
        manufacturer: make.trim(),
        model: model.trim(),
        year: parseInt(year, 10),
        fuelType,
        status: vehicleStatus,
        name: name.trim() || undefined,
      },
    });
  }

  if (done) {
    return (
      <ModalShell title="Vehicle Added" onClose={onClose}>
        <div className="space-y-4">
          <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-sm text-emerald-800 dark:text-emerald-200">
            Vehicle added successfully to <strong>{client.fullName}</strong>.
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setDone(false);
                setPlate('');
                setMake('');
                setModel('');
                setYear(String(CURRENT_YEAR));
                setName('');
                setErrs({});
              }}
              className="px-4 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Add Another
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md bg-brand-600 hover:bg-brand-700 text-white"
            >
              Done
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title={`Add Vehicle — ${client.fullName}`} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Registration Plate"
            value={plate}
            onChange={(value) => setPlate(value.toUpperCase())}
            placeholder="KA-01-AB-1234"
            maxLength={32}
            error={errs.plate}
            required
          />

          <SelectField
            label="Fuel Type"
            value={fuelType}
            onChange={setFuelType}
            options={FUEL_TYPES}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Make"
            value={make}
            onChange={setMake}
            placeholder="Tata"
            maxLength={64}
            error={errs.make}
            required
          />

          <Field
            label="Model"
            value={model}
            onChange={setModel}
            placeholder="Ace Gold"
            maxLength={64}
            error={errs.model}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Year"
            type="number"
            value={year}
            onChange={setYear}
            placeholder={String(CURRENT_YEAR)}
            error={errs.year}
            required
          />

          <SelectField
            label="Status"
            value={vehicleStatus}
            onChange={setVehicleStatus}
            options={VEHICLE_STATUSES.map((status) => ({
              value: status,
              label: status.charAt(0) + status.slice(1).toLowerCase(),
            }))}
            required
          />
        </div>

        <Field
          label="Display Name"
          value={name}
          onChange={setName}
          placeholder="Optional — defaults to Make + Model"
          maxLength={64}
        />

        {serverErr && (
          <div className="text-xs px-3 py-2 rounded-md bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
            {serverErr}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-60"
          >
            {mutation.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Add Vehicle
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ClientRow({ client, onAddVehicle }) {
  const qc = useQueryClient();

  const [expanded, setExpanded] = useState(false);
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState(null);

  const vehiclesQuery = useQuery({
    queryKey: ['client-vehicles', client.userId],
    queryFn: () => fetchClientVehicles(client.userId),
    enabled: expanded,
  });

  const vehicles = vehiclesQuery.data || [];

  const deleteClientMutation = useMutation({
    mutationFn: () => deleteAdminClient(client.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-clients'] });
      qc.invalidateQueries({ queryKey: ['admin-fleet'] });
    },
    onError: () => setConfirmDeleteClient(false),
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: ({ vehicleId }) =>
      deleteClientVehicle(client.userId, vehicleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-vehicles', client.userId] });
      qc.invalidateQueries({ queryKey: ['admin-fleet'] });
      setDeletingVehicleId(null);
    },
    onError: () => setDeletingVehicleId(null),
  });

  return (
    <>
      <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <Td>
          <button
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            aria-label={expanded ? 'Collapse vehicles' : 'Expand vehicles'}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </Td>

        <Td>
          <div className="font-medium text-slate-900 dark:text-slate-100">
            {client.fullName}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {client.email}
          </div>
        </Td>

        <Td>{statusBadge(client.status)}</Td>

        <Td className="text-xs text-slate-500 dark:text-slate-400">
          {client.createdAt
            ? new Date(client.createdAt).toLocaleDateString()
            : '—'}
        </Td>

        <Td>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddVehicle(client)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Vehicle
            </button>

            {confirmDeleteClient ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Delete?
                </span>

                <button
                  onClick={() => deleteClientMutation.mutate()}
                  disabled={deleteClientMutation.isPending}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                >
                  {deleteClientMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Yes'
                  )}
                </button>

                <button
                  onClick={() => setConfirmDeleteClient(false)}
                  className="px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteClient(true)}
                className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Delete client"
                aria-label="Delete client"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </Td>
      </tr>

      {expanded && (
        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <Td colSpan={5} className="px-6 py-3">
            {vehiclesQuery.isLoading ? (
              <LoadingBlock height={60} />
            ) : vehiclesQuery.isError ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                Could not load this client's vehicles. Please try again.
              </p>
            ) : vehicles.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                No vehicles assigned yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-1.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                        Reg. Plate
                      </th>
                      <th className="pb-1.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                        Make / Model
                      </th>
                      <th className="pb-1.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                        Year
                      </th>
                      <th className="pb-1.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                        Fuel
                      </th>
                      <th className="pb-1.5 pr-4 text-slate-500 dark:text-slate-400 font-medium">
                        Status
                      </th>
                      <th className="pb-1.5 text-slate-500 dark:text-slate-400 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr
                        key={vehicle.vehicleid}
                        className="border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                      >
                        <td className="py-1.5 pr-4 font-mono text-slate-700 dark:text-slate-200">
                          {vehicle.vehicle_code}
                        </td>
                        <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">
                          {vehicle.manufacturer} {vehicle.model}
                        </td>
                        <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">
                          {vehicle.year ?? '—'}
                        </td>
                        <td className="py-1.5 pr-4 text-slate-600 dark:text-slate-300">
                          {vehicle.fuelType ?? '—'}
                        </td>
                        <td className="py-1.5 pr-4">
                          {statusBadge(vehicle.vehicleStatus ?? 'ACTIVE')}
                        </td>
                        <td className="py-1.5">
                          {deletingVehicleId === vehicle.vehicleid ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Delete?
                              </span>

                              <button
                                onClick={() =>
                                  deleteVehicleMutation.mutate({
                                    vehicleId: vehicle.vehicleid,
                                  })
                                }
                                disabled={deleteVehicleMutation.isPending}
                                className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                              >
                                {deleteVehicleMutation.isPending ? (
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                ) : (
                                  'Yes'
                                )}
                              </button>

                              <button
                                onClick={() => setDeletingVehicleId(null)}
                                className="px-1.5 py-0.5 text-[10px] rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setDeletingVehicleId(vehicle.vehicleid)
                              }
                              className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Delete vehicle"
                              aria-label="Delete vehicle"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Td>
        </tr>
      )}
    </>
  );
}

function Td({ children, className = '', colSpan }) {
  return (
    <td className={`px-4 py-3 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

function Th({ children }) {
  return (
    <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {children}
    </th>
  );
}

function PendingClientsPanel() {
  const qc = useQueryClient();

  const {
    data: pendingClients = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['pending-clients'],
    queryFn: fetchPendingClients,
  });

  const actionMutation = useMutation({
    mutationFn: ({ clientId, action }) =>
      action === 'approve'
        ? approveClient(clientId)
        : rejectClient(clientId),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-clients'] });
      qc.invalidateQueries({ queryKey: ['admin-clients'] });
    },
  });

  return (
    <Card>
      <CardHeader
        title="Pending Registrations"
        subtitle={`${pendingClients.length} account${
          pendingClients.length === 1 ? '' : 's'
        } awaiting approval`}
      />

      <CardBody>
        {isLoading ? (
          <LoadingBlock height={100} />
        ) : isError ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Could not load pending registrations:{' '}
            {error?.message || 'Please try again.'}
          </p>
        ) : pendingClients.length === 0 ? (
          <EmptyState
            title="No pending registrations"
            message="New client registrations awaiting approval will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200 dark:border-slate-800">
                  <Th>Name / Email</Th>
                  <Th>Registered</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody>
                {pendingClients.map((client) => (
                  <tr
                    key={client.userId}
                    className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <Td>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {client.fullName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {client.email}
                      </div>
                    </Td>

                    <Td className="text-xs text-slate-500 dark:text-slate-400">
                      {client.createdAt
                        ? new Date(client.createdAt).toLocaleDateString()
                        : '—'}
                    </Td>

                    <Td>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({
                              clientId: client.userId,
                              action: 'approve',
                            })
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({
                              clientId: client.userId,
                              action: 'reject',
                            })
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {actionMutation.isError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {actionMutation.error?.response?.data?.message ||
              'The action failed. Please try again.'}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

export default function AdminClientManagementPage() {
  const [vehicleTarget, setVehicleTarget] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: fetchAdminClients,
  });

  return (
    <>
      <Topbar
        title="Client Management"
        subtitle="Approve registrations and assign vehicles"
      />

      {vehicleTarget && (
        <AddVehicleModal
          client={vehicleTarget}
          onClose={() => setVehicleTarget(null)}
        />
      )}

      <div className="p-6 space-y-6">
        <PendingClientsPanel />

        <Card>
          <CardHeader
            title="Clients"
            subtitle={`${clients.length} registered client${
              clients.length === 1 ? '' : 's'
            }`}
          />

          <CardBody className="p-0">
            {isLoading ? (
              <LoadingBlock height={200} />
            ) : clients.length === 0 ? (
              <EmptyState
                title="No clients yet"
                message="New client registrations will appear here after approval."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-2 w-8" />
                      <Th>Name / Email</Th>
                      <Th>Status</Th>
                      <Th>Created</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {clients.map((client) => (
                      <ClientRow
                        key={client.userId}
                        client={client}
                        onAddVehicle={setVehicleTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
