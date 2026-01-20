import React, { createContext, useContext, useState } from 'react';

const FilteredContext = createContext();

export const FilteredProvider = ({ children }) => {
  const [currentTag, setCurrentTag] = useState(null);

  return (
    <FilteredContext.Provider value={{ currentTag, setCurrentTag }}>
      {children}
    </FilteredContext.Provider>
  );
};

export const useFiltered = () => useContext(FilteredContext);
