const C = {
  navy: "#1B2559", coral: "#E8634A", gray50: "#F8F9FC",
  gray100: "#ECEEF4", gray400: "#8B93B0", white: "#FFFFFF",
};

export default function CardiacDriftWidget() {
  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(27,37,89,0.05)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 10,
          fontWeight: 700, color: C.gray400, textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>Cardiac Drift</span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 9,
          fontWeight: 700, color: C.coral,
        }}>✦ Korsana</span>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 0', gap: 10,
      }}>
        <span style={{ fontSize: 28 }}>📈</span>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 12,
          color: C.gray400, textAlign: 'center', lineHeight: 1.6,
        }}>
          HR stream data required<br />Coming with Garmin integration
        </div>
      </div>
    </div>
  );
}
