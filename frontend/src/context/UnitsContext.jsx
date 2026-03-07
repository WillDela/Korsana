import { createContext, useContext, useState } from 'react';

const UnitsContext = createContext('metric');

export const UnitsProvider = ({ children }) => {
  const [unit, setUnit] = useState(
    () => localStorage.getItem('units_preference') || 'metric'
  );

  const updateUnit = (newUnit) => {
    localStorage.setItem('units_preference', newUnit);
    setUnit(newUnit);
  };

  return (
    <UnitsContext.Provider value={{ unit, updateUnit }}>
      {children}
    </UnitsContext.Provider>
  );
};

export const useUnits = () => useContext(UnitsContext);
