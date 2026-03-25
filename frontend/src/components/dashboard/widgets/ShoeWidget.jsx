import { useState } from 'react';
import { gearAPI } from '../../../api/dashboard';

const inputClass = 'w-full px-[10px] py-2 rounded-lg border border-[var(--color-border-light)] font-sans text-[12px] box-border';

export default function ShoeWidget({ data, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: '', max_miles: '450',
    date_purchased: '', usage_label: '', is_primary: false,
  });
  const [saving, setSaving] = useState(false);

  const shoes = data?.shoes || data || [];

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        max_miles: parseInt(form.max_miles) || 450,
        is_primary: form.is_primary,
      };
      if (form.brand) payload.brand = form.brand;
      if (form.date_purchased) payload.date_purchased = form.date_purchased;
      if (form.usage_label) payload.usage_label = form.usage_label;
      await gearAPI.addShoe(payload);
      setShowModal(false);
      setForm({ name: '', brand: '', max_miles: '450', date_purchased: '', usage_label: '', is_primary: false });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-[22px] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Shoe Mileage
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="bg-transparent border border-[var(--color-border-light)] rounded-lg px-[10px] py-[5px] font-sans text-[11px] font-semibold text-navy cursor-pointer"
        >
          + Add Shoe
        </button>
      </div>

      {shoes.length === 0 ? (
        <div className="flex flex-col items-center py-6 gap-2">
          <span style={{ fontSize: 28 }}>👟</span>
          <div className="font-sans text-[12px] text-[var(--color-text-muted)]">
            Add your running shoes to track mileage
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[14px]">
          {shoes.map((shoe, i) => {
            const pct = Math.min(
              100,
              Math.round(((shoe.current_miles || 0) / (shoe.max_miles || 450)) * 100)
            );
            const nearLimit = pct >= 80;
            return (
              <div key={shoe.id || i}>
                <div className="flex justify-between items-center mb-[5px]">
                  <div className="flex items-center gap-[7px]">
                    <span className="font-sans text-[12px] font-semibold text-navy">{shoe.name}</span>
                    {shoe.is_primary && (
                      <span className="bg-navy text-white font-sans text-[8px] font-bold rounded-full px-[6px] py-[2px]">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  {nearLimit && (
                    <span className="font-sans text-[10px]" style={{ color: '#E84A4A' }}>
                      Replace soon ⚠
                    </span>
                  )}
                </div>
                {shoe.usage_label && (
                  <div className="font-sans text-[10px] text-[var(--color-text-muted)] mb-[5px]">
                    {shoe.usage_label}
                  </div>
                )}
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
                    {Math.round(shoe.current_miles || 0)} mi
                  </span>
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                    / {shoe.max_miles || 450} mi
                  </span>
                </div>
                <div className="h-[7px] bg-[var(--color-border-light)] rounded-full">
                  <div
                    className="h-full rounded-full transition-[width] duration-300"
                    style={{
                      width: `${pct}%`,
                      background: nearLimit ? '#E84A4A' : '#2ECC8B',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/35 z-[1000]"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-[18px] px-8 py-7 z-[1001] w-[360px] shadow-[0_8px_40px_rgba(27,37,89,0.2)]">
            <div className="font-sans text-[14px] font-bold text-navy mb-5">Add Running Shoe</div>
            {[
              { label: 'Shoe Name *', field: 'name', type: 'text', placeholder: 'e.g. Pegasus 41' },
              { label: 'Brand', field: 'brand', type: 'text', placeholder: 'e.g. Nike' },
              { label: 'Max Mileage', field: 'max_miles', type: 'number', placeholder: '450' },
              { label: 'Date Purchased', field: 'date_purchased', type: 'date' },
              { label: 'Usage Label', field: 'usage_label', type: 'text', placeholder: 'e.g. Easy & Long' },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} className="mb-3">
                <label className="font-sans text-[11px] text-[var(--color-text-muted)] block mb-[3px]">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  className={inputClass}
                />
              </div>
            ))}
            <label className="flex items-center gap-2 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={e => setForm(f => ({ ...f, is_primary: e.target.checked }))}
              />
              <span className="font-sans text-[12px] text-navy">Set as primary shoe</span>
            </label>
            <div className="flex gap-[10px]">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-[10px] rounded-[10px] border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] font-sans text-[12px] font-semibold text-[var(--color-text-secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-[2] py-[10px] rounded-[10px] border-0 bg-navy font-sans text-[12px] font-bold text-white cursor-pointer disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Add Shoe'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
