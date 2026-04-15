import { createContext, useContext, useState } from 'react';

const UnitsContext = createContext('imperial');

export const UnitsProvider = ({ children }) => {
  const [unit, setUnit] = useState(
    () => localStorage.getItem('units_preference') || 'imperial'
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
