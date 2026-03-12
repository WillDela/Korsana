import { useState } from 'react';
import { gearAPI } from '../../../api/dashboard';

const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray200: "#D4D8E8", gray400: "#8B93B0",
  gray600: "#4A5173", white: "#FFFFFF", green: "#2ECC8B",
  amber: "#F5A623", red: "#E84A4A",
};

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
      setForm({
        name: '', brand: '', max_miles: '450',
        date_purchased: '', usage_label: '', is_primary: false,
      });
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
      }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 10,
          fontWeight: 700, color: C.gray400, textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>Shoe Mileage</span>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'none', border: `1px solid ${C.gray200}`,
            borderRadius: 8, padding: '5px 10px',
            fontFamily: 'DM Sans, sans-serif', fontSize: 11,
            fontWeight: 600, color: C.navy, cursor: 'pointer',
          }}
        >+ Add Shoe</button>
      </div>
      {shoes.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 0', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>👟</span>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontSize: 12,
            color: C.gray400,
          }}>Add your running shoes to track mileage</div>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {shoes.map((shoe, i) => {
            const pct = Math.min(
              100,
              Math.round(
                ((shoe.current_miles || 0) / (shoe.max_miles || 450)) * 100
              )
            );
            const nearLimit = pct >= 80;
            return (
              <div key={shoe.id || i}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 5,
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                      fontWeight: 600, color: C.navy,
                    }}>{shoe.name}</span>
                    {shoe.is_primary && (
                      <span style={{
                        background: C.navy, color: C.white,
                        fontFamily: 'DM Sans, sans-serif', fontSize: 8,
                        fontWeight: 700, borderRadius: 99,
                        padding: '2px 6px',
                      }}>PRIMARY</span>
                    )}
                  </div>
                  {nearLimit && (
                    <span style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: 10,
                      color: C.red,
                    }}>Replace soon ⚠</span>
                  )}
                </div>
                {shoe.usage_label && (
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif', fontSize: 10,
                    color: C.gray400, marginBottom: 5,
                  }}>{shoe.usage_label}</div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                    color: C.gray600,
                  }}>{Math.round(shoe.current_miles || 0)} mi</span>
                  <span style={{
                    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                    color: C.gray400,
                  }}>/ {shoe.max_miles || 450} mi</span>
                </div>
                <div style={{
                  height: 7, background: C.gray100, borderRadius: 99,
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: nearLimit ? C.red : C.green,
                    borderRadius: 99, transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.35)', zIndex: 1000,
            }}
            onClick={() => setShowModal(false)}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)', background: C.white,
            borderRadius: 18, padding: '28px 32px', zIndex: 1001,
            width: 360,
            boxShadow: '0 8px 40px rgba(27,37,89,0.2)',
          }}>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontSize: 14,
              fontWeight: 700, color: C.navy, marginBottom: 20,
            }}>Add Running Shoe</div>
            {[
              {
                label: 'Shoe Name *', field: 'name', type: 'text',
                placeholder: 'e.g. Pegasus 41',
              },
              {
                label: 'Brand', field: 'brand', type: 'text',
                placeholder: 'e.g. Nike',
              },
              {
                label: 'Max Mileage', field: 'max_miles', type: 'number',
                placeholder: '450',
              },
              {
                label: 'Date Purchased', field: 'date_purchased',
                type: 'date',
              },
              {
                label: 'Usage Label', field: 'usage_label', type: 'text',
                placeholder: 'e.g. Easy & Long',
              },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{
                  fontFamily: 'DM Sans, sans-serif', fontSize: 11,
                  color: C.gray400, display: 'block', marginBottom: 3,
                }}>{label}</label>
                <input
                  type={type} value={form[field]}
                  onChange={e =>
                    setForm(f => ({ ...f, [field]: e.target.value }))
                  }
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${C.gray200}`,
                    fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8,
              marginBottom: 20, cursor: 'pointer',
            }}>
              <input
                type="checkbox" checked={form.is_primary}
                onChange={e =>
                  setForm(f => ({ ...f, is_primary: e.target.checked }))
                }
              />
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                color: C.navy,
              }}>Set as primary shoe</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: `1px solid ${C.gray200}`,
                  background: C.gray50,
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  fontWeight: 600, color: C.gray600, cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                style={{
                  flex: 2, padding: '10px', borderRadius: 10,
                  border: 'none', background: C.navy,
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                  fontWeight: 700, color: C.white,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: !form.name.trim() ? 0.6 : 1,
                }}
              >{saving ? 'Saving...' : 'Add Shoe'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
