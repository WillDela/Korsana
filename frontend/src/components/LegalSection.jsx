const LegalSection = ({ title, children }) => (
  <div className="mb-8 last:mb-0">
    <h2 className="text-base font-semibold text-navy mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
      {title}
    </h2>
    {children}
  </div>
);

export default LegalSection;
