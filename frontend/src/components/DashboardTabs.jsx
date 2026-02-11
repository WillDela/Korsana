import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const tabs = ['Overview', 'Charts', 'Activities'];

const DashboardTabs = ({ chartData = [], paceData = [], activities = [], formatPace, metersToMiles, formatDate, className = '' }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const tooltipStyle = {
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '0.8125rem',
  };

  return (
    <div className={className}>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-navy border-navy'
                : 'text-text-muted border-transparent hover:text-text-secondary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Volume chart - 3/5 width */}
              <div className="lg:col-span-3 bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Weekly Volume
                </h3>
                <div className="h-[240px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} dy={8} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'var(--color-bg-elevated)' }} contentStyle={tooltipStyle} />
                        <Bar dataKey="miles" fill="var(--color-navy)" radius={[4, 4, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-text-muted">
                      No data yet — sync your activities
                    </div>
                  )}
                </div>
              </div>

              {/* Recent activities - 2/5 width */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-4 border-b border-border-light">
                  <h3 className="text-sm font-semibold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                    Recent Activities
                  </h3>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="p-6 text-center text-sm text-text-muted">No activities yet</div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <tbody>
                        {activities.slice(0, 6).map((activity, i) => (
                          <tr key={i} className="border-b border-border-light last:border-0 hover:bg-bg-elevated transition-colors">
                            <td className="px-5 py-3">
                              <div className="font-medium text-text-primary">{formatDate(activity.start_time)}</div>
                              <div className="text-xs text-text-muted truncate max-w-[140px]">{activity.name}</div>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="font-medium text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                                {metersToMiles(activity.distance_meters)} mi
                              </div>
                              <div className="text-xs text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                                {formatPace(activity.average_pace_seconds_per_km)}/mi
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Charts' && (
            <div className="space-y-6">
              {/* Volume chart - full width */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Weekly Volume
                </h3>
                <div className="h-[280px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} dy={8} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'var(--color-bg-elevated)' }} contentStyle={tooltipStyle} />
                        <Bar dataKey="miles" fill="var(--color-navy)" radius={[4, 4, 0, 0]} barSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-text-muted">No volume data</div>
                  )}
                </div>
              </div>

              {/* Pace trend */}
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                  Pace Trend
                </h3>
                <div className="h-[240px]">
                  {paceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={paceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} dy={8} />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                          tickLine={false}
                          axisLine={false}
                          reversed
                          domain={['auto', 'auto']}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(val, name, props) => [props.payload.label + '/mi', 'Pace']}
                        />
                        <Line
                          type="monotone"
                          dataKey="pace"
                          stroke="var(--color-coral)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--color-coral)' }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-text-muted">No pace data</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Activities' && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="p-8 text-center text-sm text-text-muted">No activities yet — connect Strava and sync</div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="table-header">Date</th>
                        <th className="table-header">Activity</th>
                        <th className="table-header text-right">Distance</th>
                        <th className="table-header text-right">Pace</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity, i) => (
                        <tr key={i} className="border-b border-border-light last:border-0 hover:bg-bg-elevated transition-colors">
                          <td className="px-5 py-3 text-text-secondary">{formatDate(activity.start_time)}</td>
                          <td className="px-5 py-3 font-medium text-text-primary">{activity.name}</td>
                          <td className="px-5 py-3 text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                            {metersToMiles(activity.distance_meters)} mi
                          </td>
                          <td className="px-5 py-3 text-right text-text-secondary" style={{ fontFamily: 'var(--font-mono)' }}>
                            {formatPace(activity.average_pace_seconds_per_km)}/mi
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DashboardTabs;
